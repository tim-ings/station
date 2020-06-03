import { readFileStr } from "./deps.ts";
import { parseTimetable } from "./timetable.ts";
import { startServer } from "./server.ts";
import { getConfig } from "./config.ts";


const config = getConfig();
const timetable = parseTimetable(await readFileStr(`/app/timetables/tt-${config.name}`));

startServer(config, timetable);

console.log(`Station ${config.name} is listening with neighbours ${config.neighbours.join(" ")}`);
