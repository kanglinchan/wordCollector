"use strict"
import {APPKEY, TOKEN} from './config/index'
import Nls from 'alibabacloud-nls'
// require('log-timestamp')(`${process.pid}`)
import fs from 'fs'
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
import util from 'util'
import readline from 'readline'
//const Memwatch = require("node-memwatch-new")
const URL = "wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1"
const args = process.argv.slice(2)





let b1 = []
let loadIndex = 0
//let hd = new Memwatch.HeapDiff()
let needDump = true

async function runOnce(line) {
    console.log(`speak: ${line}`)
    loadIndex++

    let dumpFile = fs.createWriteStream(`${process.pid}.mp3`, {flags:"w"})
    let metaDumpFile = fs.createWriteStream(`${process.pid}_meta.txt`, {flags:"w", encodeing: 'utf8'})
    let tts = new Nls.SpeechSynthesizer({
        url: URL,
        appkey:APPKEY,
        token:TOKEN
    })

    tts.on("meta", (msg)=>{
        console.log("Client recv metainfo:", msg)
        metaDumpFile.write(msg, "binary")
    })

    tts.on("data", (msg)=>{
        console.log(`recv size: ${msg.length}`)
        dumpFile.write(msg, "binary")
    })

    tts.on("completed", (msg)=>{
        console.log("Client recv completed:", msg)
    })

    tts.on("closed", () => {
        console.log("Client recv closed")
    })

    tts.on("failed", (msg)=>{
        console.log("Client recv failed:", msg)
    })

    let param = tts.defaultStartParams()
    param.text = line
    param.voice = "siyue"
    param.enable_subtitle = true
    param.format = "mp3"
    try {
        await tts.start(param, true, 6000)
    } catch(error) {
        console.log("error on start:", error)
        return
    } finally {
        dumpFile.end()
        metaDumpFile.end()
    }
    console.log("synthesis done")
    await sleep(2000)
}

async function test() {
    console.log("load test case:", args[0])
    const fileStream = fs.createReadStream(args[0])
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    for await (const line of rl) {
        b1.push(line)
    }

    for (let text of b1) {
        await runOnce(text)
    }
}

test()
