import path from "path";
import axios from "axios";
import ora from 'ora'
import {DataSource, In} from "typeorm"
import {Exchange, MediaType, RunInfo, Symbols, TaskList, TaskStatus, wordResponse} from './types'
import {Collection} from "./collection";
import {createResourceUrl, downloadResource, parseMusic} from './utils'
import {AppDataSource} from "./data-source";
import {downloadAMDir, downloadEnDir, downloadTTSDir, maxBlockCount} from "./config";
import {Word} from "./entity/Word";
import {Part} from "./entity/Part";
import wordJSON from '../wordSource/2000word'
import {Media} from "./entity/Media";
import logger from "./logger";


function fetchWordTask(word:string){
    const url = createResourceUrl(word)
    return axios.get(url).then((res)=>{
        if(res.status === 200){
            const data: wordResponse = res.data
            const symbol : Symbols = data.symbols[0]
            const exchange: Exchange = res.data.exchange  || {}
            if(symbol && exchange){
                return {
                    word: data.word_name,
                    phAmMp3: symbol.ph_am_mp3,
                    phEnMp3: symbol.ph_en_mp3,
                    phTtsMp3: symbol.ph_tts_mp3,
                    parts: symbol.parts || [],
                    phEn:symbol.ph_en,
                    phAm: symbol.ph_am,
                    phOther: symbol.ph_other,
                    exchange: exchange
                }
            }else{
                return null
            }

        }else{
            return null
        }
    })
}



// (async ()=>{
//     const dataSource = await AppDataSource.initialize()
//     try{
//
//     }catch (e){
//         console.log(e)
//     }finally {
//        await dataSource.destroy()
//         console.log('close')
//     }
// })()

/**
 * 读取文件时长
 * @param filePath
 */
async function readyMusicInfo(filePath:string){
    if(filePath){
        const info = await parseMusic(filePath);
        return info && info.duration ? info.duration: 0
    }
    return 0
}

function formatExchange(exchange: [] | string){
    if(!exchange){
        return ''
    }
    if(Array.isArray(exchange)){
        return exchange.join(',')
    }
    return exchange
}

async function process(dataSource: DataSource, wordName: string){
    const wordData = await fetchWordTask(wordName)
    if (!wordData){
        throw new EvalError(`单词${wordName}不存在！`)
    }

    logger.info(`${wordName}--${JSON.stringify(wordData)}`)

    const word = new Word()

    const amMp3 = await downloadResource(wordData.phAmMp3, downloadEnDir)
    const enMp3 = await downloadResource(wordData.phEnMp3, downloadAMDir)
    const ttsMp3 = await downloadResource(wordData.phTtsMp3, downloadTTSDir)
    const amFileName = path.basename(amMp3)
    const enFileName = path.basename(enMp3)
    const ttsFileName = path.basename(ttsMp3)

    const tts = new Media()
    tts.wordName =  wordData.word
    tts.fileName = ttsFileName
    tts.type = MediaType.tts
    tts.duration = await readyMusicInfo(ttsMp3)

    const en = new Media()
    en.wordName = wordData.word
    en.fileName = enFileName
    en.type = MediaType.en
    en.duration = await readyMusicInfo(enMp3)

    const am = new Media()
    am.wordName =  wordData.word
    am.fileName =amFileName
    am.type = MediaType.am
    am.duration = await readyMusicInfo(amMp3)

    word.medias = [am, en, tts].filter(item=>item.fileName)


    const parts = wordData.parts.map(item=>{
        const part = new Part()
        part.wordName = wordData.word
        part.part = item.part
        part.means = item.means.join(',')
        return part
    })

    word.er = formatExchange(wordData.exchange.word_er)
    word.est = formatExchange(wordData.exchange.word_est)
    word.done = formatExchange(wordData.exchange.word_done)
    word.pl = formatExchange(wordData.exchange.word_pl)
    word.ing = formatExchange(wordData.exchange.word_ing)
    word.third = formatExchange(wordData.exchange.word_third)
    word.past = formatExchange(wordData.exchange.word_past)
    word.phEn = wordData.phEn ? `[${wordData.phEn}]` : ''
    word.phAm = wordData.phAm ? `[${wordData.phAm}]`: ''
    word.phOther = wordData.phOther ? `[${wordData.phOther}]` : ''
    word.wordName = wordData.word || ''
    word.parts = parts
    await dataSource.getRepository(Word).save(word)

}

function collectRunningInfo(taskList: TaskList){
    const total = taskList.length
    const success = taskList.filter(item=>item.status === TaskStatus.done).length
    const pending = taskList.filter(item=>item.status === TaskStatus.pending).length
    const waiting = taskList.filter(item=>item.status === TaskStatus.waiting).length
    const fail = total - (pending + success + waiting)
    const isDone = waiting + pending === 0
    return {
        total, success, fail, pending, isDone
    }
}

async function main(){
    try {
        const spinner = ora(`starting.......`).start();
        const dataSource = await AppDataSource.initialize()
        const wordList = wordJSON || []
        const taskList = wordList.map(item=>({
            word: item,
            status: TaskStatus.waiting
        }))
        let index = 0
        const collection = new Collection({
            cronExpression: '1/2 * * * * *',
            onTick(){
                const task = taskList[index];
                if(task){
                    task.status = TaskStatus.pending
                    process(dataSource, task.word)
                        .then(()=>{
                            task.status = TaskStatus.done

                        }).catch((e)=>{
                        task.status = TaskStatus.fail
                        logger.error(JSON.stringify(task))
                        logger.error(e.message)
                        logger.debug(e.stack)
                    }).finally(()=>{
                        const info = collectRunningInfo(taskList)
                        this.emit('process', info)
                    })
                }
                const info = collectRunningInfo(taskList)
                this.emit('tick', info)
                index++
            }
        })

        collection.on('tick', async function (info: RunInfo){
            const percentage = Number((info.success) / info.total * 100).toFixed(1)
            spinner.text = `Progress percentage is ${percentage}%, done: ${info.success}, fail: ${info.fail}, pending: ${info.pending}`
            if(info.isDone){
                spinner.text = 'Task done ...'
                spinner.stop()
                if(dataSource.isInitialized){
                    await dataSource.destroy()
                }
                return
            }
            if(info.pending > maxBlockCount){
                spinner.text = `pending process task more than ${maxBlockCount}, stop`
                collection.stop()
                return;
            }
        })

        collection.on('process', function (this: Collection, info: RunInfo){
            if(!this.running && !info.isDone && info.pending <= maxBlockCount){
                spinner.text = `pending process task count less than ${maxBlockCount}, restart`
                collection.start()
            }
            logger.info(info)
        })
    }catch (error){
        if(error instanceof Error){
            logger.error(error.message)
            logger.debug(error.stack)
        }
    }

}

// main()


async function queryByWords(words: Array<string>){
    const dataSource = await AppDataSource.initialize()
    const result = await dataSource
        .getRepository(Word)
        .createQueryBuilder("word")
        .leftJoinAndSelect("word.medias", 'media')
        .leftJoinAndSelect("word.parts", 'part')
        .where('word.word_name In (:...words)',{ words: words })
        .groupBy('word.word_name')
        .distinctOn(['word.word_name'])
        .printSql()
        .getMany()
        // .getSql()
    if(!dataSource.isInitialized){
        await dataSource.destroy()
    }
    return result
}

queryByWords(['test', 'event', 'log']).then((data)=>{
    console.log(JSON.stringify(data))
})


// collection.on('done', (params)=>{
//     spinner.text = `${chalk.red(params.now)}`
// })


