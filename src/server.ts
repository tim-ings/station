import { opine } from "./deps.ts";
import { json } from "./deps.ts";
import { Trip } from "./timetable.ts";
import { StationConfig } from "./config.ts";

export interface Route {
    path: Trip[];
    valid: boolean;
    destination: string;
}

const last = <T>(arr: T[]) => arr ? [...arr].pop(): null;

const neighbourUrl = (neighbour: string | undefined, port: number): string => 
    `http://${neighbour}:${port}/`; 

const appendTrip = (route: Route, trip: Trip): Route => { 
    return { ...route, path: [...route.path, trip] }; 
}

const fetchNeighbour = (port: number, route: Route) => (trip: Trip | null) =>
    trip ?
    fetch(neighbourUrl(trip.destination, port), {
        method: "POST",
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(appendTrip(route, trip)) 
    }) :
    null;

const fetchAllNeighbours = (route: Route, trips: Trip[], config: StationConfig) => 
    config.neighbours
    .map(bestTrip(route, trips)) // find the best trip to each neighbour
    .filter(trip => { if (trip) return trip; }) // filter null trips
    .map(fetchNeighbour(config.port, route)); // create fetches

const tripGoingToAfterTime = (to: string, after: number) => (trip: Trip) =>
    trip.destination === to && 
    trip.departsAt >= (after);

const bestTrip = (route: Route, trips: Trip[]) => (to: string): Trip | null => 
    trips
    .sort((a, b) => a.arrivesAt - b.arrivesAt)
    .find(tripGoingToAfterTime(to, last(route.path)?.arrivesAt || 0)) ||
    null;

const parseReplies = (replies: (Response | null)[]): Promise<Route[]> =>
    Promise.all(replies.map(data => data ? data.json() : null));

const getBestRoute = (routes: Route[]): Route | undefined => 
    routes
    .sort((a, b) => (last(a?.path)?.arrivesAt || 0) - (last(b.path)?.arrivesAt || 0))
    .find(r => r?.valid);

const isDestinationFound = (route: Route, currentStation: string) => 
    route.destination === currentStation;

const isLoop = (route: Route, currentStation: string) => 
    route.path
    .slice(0, route.path.length - 1) 
    .find(trip => trip.destination === currentStation);

const findRouteInNeighbours = async (config: StationConfig, trips: Trip[], route: Route): Promise<Route> =>
    await Promise.all(fetchAllNeighbours(route, trips, config))
    .then(parseReplies)
    .then(getBestRoute) || 
    { ...route, valid: false };

const findRoute = async (config: StationConfig, trips: Trip[], route: Route): Promise<Route> =>
    isDestinationFound(route, config.name) ? 
    { ...route, valid: true } : 
    isLoop(route, config.name) ? 
    { ...route, valid: false } : 
    await findRouteInNeighbours(config, trips, route);

const startNewRoute = (from: string, to: string, at: string): Route => {
    return {
        path: [{
            tripName: "",
            stopName: "",
            departsAt: Number(at),
            arrivesAt: Number(at),
            destination: to
        }],
        destination: to,
        valid: false,
    }
};

export const startServer = (config: StationConfig, trips: Trip[]) => 
    opine()
    .use(json())
    .get("/", async (req, res) =>
        res.setStatus(200)
        .json(await findRoute(config, trips, startNewRoute(config.name, req.query.to, req.query.at))))
    .post("/", async (req, res) =>
        res.setStatus(200)
        .json(await findRoute(config, trips, req.parsedBody)))
    .listen(config.port);
