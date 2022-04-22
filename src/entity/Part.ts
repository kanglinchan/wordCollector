import { Entity, PrimaryGeneratedColumn, Generated, ManyToOne, Column } from "typeorm"
import {Word} from "./Word";

@Entity()
export class Part {

    @PrimaryGeneratedColumn()  // 唯一
    id: string

    @Column({comment: '名称', name: 'word_name'})
    wordName: string

    @Column({comment: '词性'})
    part: string


    @Column({comment: '意义'})
    means: string

    @ManyToOne(() => Word, word => word.parts)
    word: Word

}
