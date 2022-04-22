import { Entity, PrimaryGeneratedColumn, OneToMany, Generated, Column } from "typeorm"
import {Part} from './Part'

@Entity()
export class Word {

    @PrimaryGeneratedColumn()  // 唯一
    id: number

    @Column({comment: '名称', name: 'word_name'})
    wordName: string

    @Column({comment: '英', name: 'ph_en_mp3'})
    phEnMp3: string

    @Column({comment: '美', name: 'ph_am_mp3'})
    phAmMp3: string

    @OneToMany(() => Part, part => part.word, {
        cascade: true,
    })
    parts: Part[]

}

