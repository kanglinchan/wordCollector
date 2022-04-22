import {Collection} from "../collection";

export interface Exchange {
    word_pl: string[];
    word_third: string[];
    word_past: string[];
    word_done: string[];
    word_ing: string[];
    word_er: string;
    word_est: string;
}

export interface Parts {
    part: string;
    means: string[];
}

export interface Symbols {
    ph_en: string;
    ph_am: string;
    ph_other: string;
    ph_en_mp3: string;
    ph_am_mp3: string;
    ph_tts_mp3: string;
    parts: Parts[];
}

export interface wordResponse {
    word_name: string;
    is_CRI: string;
    exchange: Exchange;
    symbols: Symbols[];
}

export type CollectionOption = {
    cronExpression?: string,
    onTick: (this: Collection) => void,
    coComplete?: () => void | null,
    start?: boolean
}

export enum TaskStatus {
    pending= -1,
    fail= 0,
    done= 1,
    waiting= 3
}

export type TaskList = Array<{
    word: string,
    status: TaskStatus
}>

export type RunInfo = {
    total: number,
    success:number,
    fail:number,
    pending:number,
    waiting: number,
    isDone: boolean
}
