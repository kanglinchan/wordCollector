import {IAudioMetadata, IFormat} from "music-metadata/lib/type";

const path = require('path');
import musicMetadata from 'music-metadata'
const util = require('util');
const download = require('download')
import {downloadEnDir, downloadTempDir, wordUrlTemp} from '../config'

export function resolvePath(name: string){
    return path.resolve(__dirname, name)
}

export function getResourceName(url:string){
    const pathname = new URL(url).pathname
    return pathname ? pathname.replace(/(\/.*)*\//,''): ''
}

export async function downloadResource(url:string, dist=downloadTempDir){
    await download(url, dist);
    const name = getResourceName(url)
    return path.join(downloadTempDir, name)
}


export function createResourceUrl(word:string){
    return wordUrlTemp + word
}


export function splitWordText(text: string){
    return text.split(/[,，。\s\.]+/).filter(word=>!!word)
}

/**
 * 解析音频
 * @param path
 */
export async function parseMusic(path: string): Promise<IFormat>{
    const metadata = await musicMetadata.parseFile(path);
    return metadata.format
}
