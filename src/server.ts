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

const appendTrip = (route: Route, trip: Trip): Route => { 
        return {
            ...route,
            path: [...route.path, trip]
        }; 
    }

const fetchNeighbour = (port: number, route: Route) => (trip: Trip | null) =>
    trip ? 
    fetch(neighbourUrl(trip.destination, port), { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(appendTrip(route, trip)) 
    }) : 
    null;

const bestTrip = (route: Route, trips: Trip[]) => (to: string): Trip | null => 
    trips
    .sort((a, b) => a.arrivesAt - b.arrivesAt)
    .find(trip => trip.destination === to && trip.departsAt >= (last(route.path)?.arrivesAt || 0)) 
    || null;

const findRoute = async (config: StationConfig, trips: Trip[], route: Route): Promise<Route> => {
    // base case
    if (route.destination === config.name)
        return { ...route, status: "valid" } 
    
    // check for loops 
    const loopTrip = 
        route.path.slice(0, route.path.length - 1)
        .find(trip => trip.destination === config.name);
    if (loopTrip)
        return { ...route, status: "invalid" }

    // query neighbours
    const requests = 
        config.neighbours
        .map(bestTrip(route, trips))
        .filter((item) => { if (item) return item; })
        .map(fetchNeighbour(config.port, route));
    const replies = await Promise.all(requests);
    const routes: Route[] = await Promise.all(replies.map(data => data ? data.json() : null));
    
    return routes
        .sort((a, b) => (a && last(a.path)?.arrivesAt || 0) - (b && last(b.path)?.arrivesAt || 0))
        .find(r => r && r.status === "valid") || { ...route, status: "invalid" };
}

export const startServer = (config: StationConfig, trips: Trip[]) => 
    opine()
    .use(json())
    .all("/", async (req, res) =>
        res.setStatus(200)
        .json(await findRoute(config, trips, req.parsedBody)))
    .listen(config.port);
