import { Router } from 'express';
import db from '../database/connection.js';
import moment from 'moment'; 

const router = Router();

router.get('/test', (req, res) =>{
    res.send("data: test")
})

router.get('/api/bookings/four-weeks', async (req, res) => {
    const startDate = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const endDate = moment().add(3, 'weeks').endOf('isoWeek').format('YYYY-MM-DD');

    try {
        const [bookings] = await db.promise().query(
            `SELECT sh.date, sh.shift_type, u.name 
             FROM desk_bookings db
             JOIN shifts sh ON db.shift_id = sh.id
             JOIN users u ON db.user_id = u.id
             WHERE sh.date BETWEEN ? AND ?
             ORDER BY sh.date, sh.shift_type;`,
            [startDate, endDate]
        );

        let bookingInfo = {};

        for (let m = moment(startDate); m.diff(endDate, 'days') <= 0; m.add(1, 'days')) {
            let dateKey = m.format('DD-MM-YYYY');
            bookingInfo[dateKey] = {
                morning: { spotsLeft: 7, bookings: [] },
                afternoon: { spotsLeft: 7, bookings: [] }
            };
        }
        bookings.forEach(booking => {
            let dateKey = moment(booking.date).format('DD-MM-YYYY');
            let shiftKey = booking.shift_type === 'morning' ? 'morning' : 'afternoon';
            bookingInfo[dateKey][shiftKey].spotsLeft--;
            bookingInfo[dateKey][shiftKey].bookings.push(booking.name);
        });

        res.json(bookingInfo);
    } catch (err) {
        console.error('Error fetching booking information:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
