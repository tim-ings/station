import { readFileStr } from "./deps.ts";
import { parseTimetable } from "./timetable.ts";
import { startServer } from "./server.ts";

export interface StationConfig {
    name: string;
    port: number;
    neighbours: string[];
}

const getConfig = (): StationConfig => {
    const [name, ...neighbours] = Deno.args;
    return {
        name,
        port: 3000,
        neighbours,
    };
}

const config = getConfig();
const timetable = parseTimetable(await readFileStr(`/app/timetables/tt-${config.name}`));

startServer(config, timetable);

console.log(`Station ${config.name} is listening with neighbours ${config.neighbours.join(" ")}`);
