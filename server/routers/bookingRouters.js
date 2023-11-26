import { Router } from 'express';
import db from '../database/connection.js';
import moment from 'moment';
import { io } from '../app.js';
import { isAuthenticated } from '../util/checkAuth.js';

const router = Router();


router.get('/api/bookings/four-weeks',isAuthenticated, async (req, res) => {
    const departmentId = req.session.user.department_id;
    const startDate = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const endDate = moment().add(3, 'weeks').endOf('isoWeek').format('YYYY-MM-DD');

    try {
        const [[{ num_desks }]] = await db.promise().query(`SELECT num_desks FROM departments WHERE id = ?`, [departmentId]);

        const [bookings] = await db.promise().query(
            `SELECT db.date, db.shift, u.name, db.id
             FROM desk_bookings db
             JOIN users u ON db.user_id = u.id
             WHERE db.date BETWEEN ? AND ? AND db.department_id = ?
             ORDER BY db.date, db.shift;`,
            [startDate, endDate, departmentId]
        );

        let bookingInfo = {};

        for (let m = moment(startDate); m.diff(endDate, 'days') <= 0; m.add(1, 'days')) {
            if (m.isoWeekday() <= 5) {
                let dateKey = m.format('DD-MM-YYYY');
                bookingInfo[dateKey] = {
                    morning: { spotsLeft: num_desks, bookings: [] },
                    afternoon: { spotsLeft: num_desks, bookings: [] },
                };
            }
        }

        bookings.forEach(booking => {
            let dateKey = moment(booking.date).format('DD-MM-YYYY');
            let shiftKey = booking.shift === 'morning' ? 'morning' : 'afternoon';
            bookingInfo[dateKey][shiftKey].spotsLeft--;
            bookingInfo[dateKey][shiftKey].bookings.push({ name: booking.name, bookingId: booking.id });
        });

        res.json(bookingInfo);
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

router.post('/api/bookings/book-shift',isAuthenticated, async (req, res) => {
    const user = req.session.user;
    const shift = req.body.shift_type;
    const date = moment(req.body.shift_date, 'DD-MM-YYYY').format('YYYY-MM-DD');

    try {
        const [existing] = await db
            .promise()
            .query(`SELECT id FROM desk_bookings WHERE user_id = ? AND shift = ? AND date = ? AND department_id = ?`, [
                user.user_id,
                shift,
                date,
                user.department_id,
            ]);

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Booking already exists for this date and shift.' });
        }
        const [result] = await db
            .promise()
            .query(`INSERT INTO desk_bookings (user_id, department_id, shift, date) VALUES (?, ?, ?, ?)`, [user.user_id, user.department_id, shift, date]);

        if (result) {
            io.emit('bookingUpdate');
            res.status(200).json({ message: 'Booking successful' });
        } else {
            res.status(400).json({ error: 'Booking failed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/api/bookings/cancel-shift',isAuthenticated, async (req, res) => {
    const bookingId = req.body.booking_id;

    try {
        const [result] = await db.promise().query(`DELETE FROM desk_bookings WHERE id=?`, [bookingId]);

        if (result) {
            io.emit('bookingUpdate');
            res.status(200).json({ message: 'Booking successful' });
        } else {
            res.status(400).json({ error: 'Booking failed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
