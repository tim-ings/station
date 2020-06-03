import * as yaml from 'https://deno.land/std@0.51.0/encoding/yaml.ts';
import { readFileStr, writeFileStr } from 'https://deno.land/std@0.51.0/fs/mod.ts';

interface ComposeFileService {
    build: string;
    command: string;
    ports: string[];
    volumes?: string[];
    environment?: string[];
}

interface ComposeFile {
    version: string;
    services: {
        [key: string]: ComposeFileService;
    };
}

interface Station {
    name: string;
    port: number;
    neighbours: string[];
}

const parseAdjacencyMatrix = (adjData: string): string[][] =>
    adjData
    .trim()
    .split("\n")
    .map((line: string) => line.split(" "));

const createStations = (startPort: number, adjMat: string[][]): Station[] => 
    adjMat
    .map((line, idx): Station => {
        const [name, ...neighbours] = line.map(s => s.toLowerCase());
        return { 
            name,
            neighbours,
            port: startPort + idx,
        }
    });

const generateDenoRun = (station: Station) => 
    `run --unstable --allow-read --allow-net /app/src/main.ts ${station.name} ${station.neighbours.join(" ")}`;

const generateComposeFile = (stations: Station[], internalWebPort: number, timeTableSet: string): ComposeFile => {
    const comp = {
        version: "3",
        services: {}
    };
    const services = stations.map((s: Station): { [x: string]: ComposeFileService; } => {
        return {
            [s.name]: {
                build: "./",
                command: generateDenoRun(s),
                ports: [`${s.port}:${internalWebPort}`],
                volumes: [
                    './src:/app/src',
                    `${timeTableSet}:/app/timetables`,
                ],
            }
        };
    });
    Object.assign(comp.services, ...services);
    return comp;
}

const internalWebPort = 3000; // container http port
const startPort = 4001; // host http port for each container, 4001, 4002, 4003, ...

const [adjFile, outFile, timeTableSet] = Deno.args as string[];
if (!adjFile || !outFile || !timeTableSet) {
    console.log("Usage: generate_compose <adjacency-matrix> <out-compose-file> <time-table-set>");
    Deno.exit(1);
}

const adjData = await readFileStr(adjFile);
const ajdMat = parseAdjacencyMatrix(adjData);
const stations = createStations(startPort, ajdMat);
console.dir(stations);

const composeFile = generateComposeFile(stations, internalWebPort, timeTableSet);
const yamlString = yaml.stringify(composeFile, { lineWidth: 999 });
console.log(yamlString)
await writeFileStr(outFile, yamlString);
