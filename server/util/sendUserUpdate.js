import db from '../database/connection.js';
import moment from 'moment';
import { io } from '../app.js';

export async function sendUserUpdate(userId, shift, date) {
    const formatDate = moment(date).format('DD-MM-YYYY');
    const message = `An desk became available for the ${shift} on the ${formatDate} which has been booked for you!`;
    await db.promise().query(`INSERT INTO user_updates (user_id, update_description) VALUES (?, ?)`, [userId, message]);
    io.emit('updateNotification')
}
