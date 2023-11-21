import { createConnection } from 'mysql2';
import { config } from 'dotenv';
config();


const connection = createConnection({
    host: '35.198.155.174',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_CLOUD_PASSWORD,
    database: 'go_office',
});

connection.connect(error => {
    if (error) {
        console.error('Error connecting: ' + error.stack);
        return;
    }
    console.log('Connected as id ' + connection.threadId);
});

export default connection;