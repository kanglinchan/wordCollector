import path from "path";
import ttsConfig from "./ttsConfig";

export const rootDir = process.cwd()
export const downloadTempDir = path.resolve(rootDir, './temp')
export const downloadEnDir = path.resolve(rootDir, './temp/en')
export const downloadAMDir = path.resolve(rootDir, './temp/am')
export const downloadTTSDir = path.resolve(rootDir, './temp/tts')
export const wordUrlTemp = 'https://dict-co.iciba.com/api/dictionary.php?key=AA6C7429C3884C9E766C51187BD1D86F&type=json&w='
export const inputTextPath = path.resolve(rootDir, './wordSource/words.txt')
export const maxBlockCount = 10
export const APPKEY = ttsConfig.APPKEY
export const TOKEN = ttsConfig.TOKEN
