import "reflect-metadata"
import { DataSource } from "typeorm"
import { Word } from "./entity/Word"
import { Part } from "./entity/Part"
import {Media} from "./entity/Media";

export const AppDataSource = new DataSource({
    name: 'default',
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "123456",
    database: "word_collect",
    synchronize: true,
    logging: true,
    entities: [Word, Part, Media],
    // migrations: [],
    // subscribers: [],
    // "entities": ["src/entity/**/*.{js,ts}"],
    "migrations": ["src/migration/**/*.ts"],
    "subscribers": ["src/subscriber/**/*.ts"]
})
