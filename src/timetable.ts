export interface Trip {
    tripName: string;
    stopName: string;
    departsAt: number;
    arrivesAt: number;
    destination: string;
}

const parseTime = (timeStr: string): number => 
    Number(timeStr.split(":").join(""));

const parseTrip = (line: string): Trip => {
    const [
        departsAt, tripName, stopName, 
        arrivesAt, destination,
    ] = line.trim().split(",");
    return {
        tripName, 
        stopName, 
        destination,
        departsAt: parseTime(departsAt), 
        arrivesAt: parseTime(arrivesAt), 
    };
}

export const parseTimetable = (fileContents: string): Trip[] =>
    fileContents
    .trim()
    .split("\n")
    .slice(1)
    .map(parseTrip);
