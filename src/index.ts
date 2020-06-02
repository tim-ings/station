import { listenAndServe } from "https://deno.land/std@0.51.0/http/server.ts";
import { opine, readFileStr } from "./deps.ts";

interface Trip {
    name: string;
    stopName: string;
    departureTime: number;
    arrivalTime: number;
    destStation: string;
}

interface Timetable {
    stationName: string;
    latitude: number;
    longitude: number;
    trips: Trip[];
}

interface Route {
    id: string;
    path: string[];
}

interface StationConfig {
    name: string;
    webPort: number;
    commPort: number;
    neighbours: number[];
}

const parseTime = (timeStr: string): number => Number(timeStr.split(":").join(""));

const parseTimetable = async (filePath: string): Promise<Timetable> => {
    const file = await readFileStr(filePath);
    const lines = file.trim().split("\n");
    const [stationName, latitude, longitude] = lines[0].trim().split(",");
    const timetable: Timetable = {
        stationName,
        latitude: Number(latitude),
        longitude: Number(longitude),
        trips: [],
    };
    lines.slice(1).map((line: string) => {
        const [departureTime, name, stopName, arrivalTime, destStation] = line.trim().split(",");
        timetable.trips.push({
            name, 
            stopName, 
            destStation,
            departureTime: parseTime(departureTime), 
            arrivalTime: parseTime(arrivalTime), 
        });
    });
    return timetable;
}

const parseArgs = (): StationConfig => {
    const [name, ...neighbours] = Deno.args;
    return {
        name,
        webPort: 3000,
        commPort: 3001,
        neighbours: neighbours.map((n: string) => Number(n))
    };
}

const findRoute = (to: string): Route => {
    return {
        id: '',
        path: [],
    };
}

const stationConfig = parseArgs();
const timetable = await parseTimetable(`/app/timetables/tt-${stationConfig.name}`);
console.log(timetable);


const webApp = opine();
const comApp = opine();

webApp.get("/", (req, res) => {
    console.log(req.params);
    res.setStatus(200).json({
        success: true,
        message: "Hello world",
    });
});

webApp.listen(stationConfig.webPort);
comApp.listen(stationConfig.commPort);
