import axios from "axios";
import { getConfig, loadEnv } from "../config/env";
import { IRandomProblemType } from "../types";

loadEnv();
const ENV = getConfig();

export async function fetchRandomProblem(): Promise<number> {
    try {
        const res = await axios.get<IRandomProblemType>(`${ENV.BASE_URL_API}/api/problems/randomId`);
        return res.data.data;
    } catch (err) {
        console.error("Failed to fetch problem", err);
        return 0;
    }
}
