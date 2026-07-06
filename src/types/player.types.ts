export interface Player {
    id: number;
    name: string;
    number: number;
    pos: 'G' | 'D' | 'M' | 'F' | string;
    photo?: string;
    teamId?: number;
}
