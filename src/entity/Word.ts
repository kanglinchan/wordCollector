import { Entity, PrimaryGeneratedColumn, OneToMany, Generated, Column } from "typeorm"
import {Part} from './Part'
import {Media} from './Media'

@Entity()
export class Word {

    @PrimaryGeneratedColumn()  // 唯一
    id: number

    @Column({comment: '名称', name: 'word_name', default: ''})
    wordName: string

    @Column({comment: '英', name: 'ph_en', default: ''})
    phEn: string

    @Column({comment: '美', name: 'ph_am', default: ''})
    phAm: string

    @Column({comment: '其他', name: 'ph_other', default: ''})
    phOther: string

    @Column({comment: 'tts', name: 'word_pl', default: ''})
    pl: string

    @Column({comment: 'word_past', name: 'word_past', default: ''})
    past: string

    @Column({comment: 'word_done', name: 'word_done', default: ''})
    done: string

    @Column({comment: 'word_ing', name: 'word_ing', default: ''})
    ing: string

    @Column({comment: 'word_third', name: 'word_third', default: ''})
    third: string

    @Column({comment: 'word_er', name: 'word_er', default: ''})
    er: string

    @Column({comment: 'word_er', name: 'word_est', default: ''})
    est: string


    @OneToMany(() => Part, part => part.word, {
        cascade: true,
    })
    parts: Part[]

    @OneToMany(() => Media, media => media.word, {
        cascade: true,
    })
    medias: Media[]

}

