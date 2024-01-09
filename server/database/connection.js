import { createConnection } from 'mysql2';
import { config } from 'dotenv';
config();


const connection = createConnection({
    //host: 'localhost',
    host: process.env.MYSQL_CLOUD_HOST,

    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE,

    //password: process.env.MYSQL_PASSWORD,
    password: process.env.MYSQL_CLOUD_PASSWORD,
});

connection.connect(error => {
    if (error) {
        console.error('Error connecting: ' + error.stack);
        return;
    }
    console.log('Connected as id ' + connection.threadId);
});

export default connection;