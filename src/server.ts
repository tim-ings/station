import { opine } from "./deps.ts";
import { Trip } from "./timetable.ts";
import { StationConfig } from "./main.ts";
import { json } from "./deps.ts";

type RouteStatus = "incomplete" | "invalid" | "valid";

export interface Route {
    path: Trip[];
    status: RouteStatus;
    destination: string;
}

const first = <T>(arr: T[]) => arr.find(x => true);
const last = <T>(arr: T[]) => [...arr].pop();

const neighbourUrl = (neighbour: string | undefined, port: number): string => 
    `http://${neighbour}:${port}/`; 

const fetchNeighbour = (trip: Trip, port: number, route: Route) => 
    fetch(neighbourUrl(trip.destination, port), { 
        method: "POST", 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify(route) 
    });

const bestTrip = (route: Route, trips: Trip[]) => (to: string): Trip | undefined => 
    trips
    .sort((a, b) => a.arrivesAt - b.arrivesAt)
    .find(trip => trip.destination === to && trip.departsAt >= (last(route.path)?.arrivesAt || 0));

const addRouteTrip = (route: Route, trip: Trip): Route => { 
    return {
        ...route,
        path: [...route.path, trip]
    }; 
}

const findRoute = async (config: StationConfig, trips: Trip[], route: Route): Promise<Route> => {
    // TODO: figure out route packet structure
    // we need a base case to unravel the recursion
    // we need to check for loops
    // if we have visited this station before then we send back no route found

    if (route.path.length <= 0) {
        route.path = [{
            tripName: "start",
            stopName: "start",
            departsAt: 0,
            arrivesAt: 0,
            destination: "start",
        }];
    }

    // base case
    if (route.destination === config.name) {
        return {
            ...route,
            status: "valid",
        };
    }

    // check for loops
    // TODO: there still could be better routes if the arrival time is better
    if (route.path.slice(0, route.path.length - 1) // exclude the last trip as it will be the current station
        .find(trip => trip.destination === config.name)) {
        return {
            ...route,
            status: "invalid",
        };
    }

    // query neighbours
    const requests = 
        config.neighbours
        .map(bestTrip(route, trips))
        .map(trip => trip ? fetchNeighbour(trip, config.port, addRouteTrip(route, trip)) : null);

    const replies = await Promise.all(requests);
    
    const routes: Route[] = await Promise.all(replies.map(data => data ? data.json() : null));
    
    return routes.sort((a, b) => (last(a.path)?.arrivesAt || 0) - (last(b.path)?.arrivesAt || 0))
        .find(r => r.status == "valid") || { ...route, status: "invalid" };
}

export const startServer = (config: StationConfig, trips: Trip[]) => 
    opine()
    .use(json())
    .all("/", async (req, res) =>
        res.setStatus(200)
        .json(await findRoute(config, trips, req.parsedBody))
    )
    .listen(config.port);
