import {CronJob} from "cron";
import EventEmitter from "events";
import {CollectionOption} from "../types";


export class Collection extends EventEmitter{
    private job : CronJob
    constructor(props: CollectionOption) {
        super()
         this.job = new CronJob(
             props.cronExpression || '* * * * * *',
             props.onTick.bind(this),
             props.coComplete || null,
             props.start || true,
             'Asia/Shanghai'
         );
    }

    get running (){
        return this.job.running
    }

    start(){
        this.job.start()
    }

    stop(){
        this.job.stop()
    }

}
