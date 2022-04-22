import path from "path";
import * as fs from "fs";
import axios from "axios";
import ora from 'ora'
import {DataSource} from "typeorm"
import {RunInfo, Symbols, TaskList, TaskStatus, wordResponse} from './types'
import {Collection} from "./collection";
import {createResourceUrl, downloadResource, splitWordText} from './utils'
import {AppDataSource} from "./data-source";
import {downloadAMDir, downloadEnDir, inputTextPath} from "./config";
import {Word} from "./entity/Word";
import {Part} from "./entity/Part";


function fetchWordTask(word:string){
    const url = createResourceUrl(word)
    return axios.get(url).then((res)=>{
        if(res.status === 200){
            const data: wordResponse = res.data
            const symbol : Symbols = data.symbols[0]
            if(symbol){
                return {
                    word: data.word_name,
                    phAmMp3: symbol.ph_am_mp3,
                    phEnMp3: symbol.ph_en_mp3,
                    parts: symbol.parts
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

async function process(dataSource: DataSource, word: string){
    const wordData = await fetchWordTask(word)
    if(wordData){
        const amMp3 = await downloadResource(wordData.phAmMp3, downloadEnDir)
        const enMp3 = await downloadResource(wordData.phEnMp3, downloadAMDir)
        const amFileName = path.basename(amMp3)
        const enFileName = path.basename(enMp3)
        if(amFileName && enFileName){
            const word = new Word()
            word.wordName = wordData.word
            word.phAmMp3 = amFileName
            word.phEnMp3 = enFileName
            word.parts = wordData.parts.map(item=>{
                const part = new Part()
                part.wordName = wordData.word
                part.part = item.part
                part.means = item.means.join(',')
                return part
            })
            await dataSource.getRepository(Word).save(word)
        }
    }
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

(async ()=>{
    try {
        const spinner = ora(`starting.......`).start();
        const dataSource = await AppDataSource.initialize()
        // await AppDataSource.synchronize()
        const wordText = fs.readFileSync(inputTextPath).toString();
        const wordList = splitWordText(wordText)
        const taskList = wordList.map(item=>({
            word: item,
            status: TaskStatus.waiting
        }))
        let index = 0
        const collection = new Collection({
            onTick(){
                const task = taskList[index];
                if(task){
                    task.status = TaskStatus.pending
                    process(dataSource, task.word)
                        .then(()=>{
                            task.status = TaskStatus.done
                        }).catch(()=>{
                        task.status = TaskStatus.fail
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
            if(info.pending > 3){
                spinner.text = 'pending process task more than 3, stop'
                collection.stop()
                return;
            }
        })

        collection.on('process', function (this: Collection, info: RunInfo){
            if(!this.running && !info.isDone && info.pending <= 3){
                spinner.text = 'pending process task count less than 3, restart'
                collection.start()
            }
        })
    }catch (e){
        console.log(e)
    }

})()


// collection.on('done', (params)=>{
//     spinner.text = `${chalk.red(params.now)}`
// })


