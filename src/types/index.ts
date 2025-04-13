export interface IUser {
    userId: number;
    username: string;
}

export interface IPlayerDetails {
    userId: number;
    username: string;
    socketId: string;
    percentage: number;
}

export interface IRoomDetails {
    roomKey: string;
    players: IPlayerDetails[];
    gameStarted: boolean;
    problems: number | null;
}

export interface IUserPercentage {
    roomKey: string;
    userId: number;
    percentage: number;
}

export interface IRandomProblemType {
    timestamp: string,
    message: string,
    code: number,
    data: number,
}