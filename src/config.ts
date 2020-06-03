export interface StationConfig {
    name: string;
    port: number;
    neighbours: string[];
}

export const getConfig = (): StationConfig => {
    const [name, ...neighbours] = Deno.args;
    return {
        name,
        port: 3000,
        neighbours,
    };
}
