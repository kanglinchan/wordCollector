import { Entity, PrimaryGeneratedColumn, Generated, ManyToOne, Column } from "typeorm"
import {Word} from "./Word";
import {MediaType} from '../types'

@Entity()
export class Media {

    @PrimaryGeneratedColumn()  // 唯一
    id: string

    @Column({comment: '名称', name: 'word_name'})
    wordName: string

    @Column({comment: '文件名'})
    fileName: string


    @Column({comment: '类型', type: 'enum', enum: MediaType})
    type: MediaType

    @Column({comment: '时长'})
    duration: number

    @ManyToOne(() => Word, word => word.medias)
    word: Word

}
