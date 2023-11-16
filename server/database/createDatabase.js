import db from './connection.js';
import { config } from 'dotenv'
config();

const isDeleteMode = process.argv.findIndex((arg) => arg === "delete") === -1 ? false : true;

if (isDeleteMode) {
    await db.exec("DROP TABLE IF EXISTS users;")
}

await db.exec(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    reset_password_token TEXT DEFAULT NULL,
    reset_password_expires INTEGER DEFAULT NULL
);`);

if(isDeleteMode){
    await db.run(`INSERT INTO users (email, name, password, is_admin) VALUES ('admin@test.com', 'Thomas', '${process.env.ADMIN_TEST_PASSWORD}', 1);`)
    await db.run(`INSERT INTO users (email, name, password) VALUES ('test@test.com', 'Casper', '${process.env.TEST_PASSWORD}');`)
}