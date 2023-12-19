import db from '../database/connection.js';
import moment from 'moment';
import { io } from '../app.js';

export async function checkForWaitlist(bookingId) {
    try {
        const [deskBookingRows] = await db.promise().query(`SELECT * FROM desk_bookings WHERE id = ?`, [bookingId]);

        if (deskBookingRows.length > 0) {
            const deskBooking = deskBookingRows[0];
            const date = moment(deskBooking.date).format('YYYY-MM-DD');

            const [waitlistRows] = await db
                .promise()
                .query(`SELECT * FROM booking_wait_list WHERE date = ? AND shift = ? ORDER BY time ASC LIMIT 1`, [date, deskBooking.shift]);

            if (waitlistRows.length > 0) {
                const waitlistUser = waitlistRows[0];
                const [newBooking] = await db.promise().query(`INSERT INTO desk_bookings (user_id, shift, date, department_id) VALUES (?, ?, ?, ?)`,[waitlistUser.user_id, waitlistUser.shift, date, waitlistUser.department_id]);
                if(newBooking){
                    await db.promise().query(`DELETE FROM booking_wait_list WHERE id = ?`,[waitlistUser.id]);
                    io.emit('bookingUpdate');
                }
            } else {
                console.log('No users in waitlist');
            }
        } else {
            console.log('No desk booking found');
        }
    } catch (err) {
        console.error('Internal Server Error', err);
    }
}