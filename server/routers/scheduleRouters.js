import { Router } from 'express';
import db from '../database/connection.js';
import moment from 'moment';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';
import { checkForWaitlist } from '../util/waitlist.js';

const router = Router();

router.get('/api/waitlist/:date', isAuthenticated, async (req, res) => {
    const date = moment(req.params).format('YYYY-MM-DD');
    const departmentId = req.session.user.department_id;
    try {
        const [waitlist] = await db.promise().query(
            `SELECT bwl.id, bwl.user_id, bwl.date, bwl.shift, bwl.time, u.name 
        FROM booking_wait_list bwl
        JOIN users u ON bwl.user_id = u.id
        WHERE bwl.date = ? AND bwl.department_id = ?;
        `,
            [date, departmentId]
        );
        res.status(200).json(waitlist);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/api/bookings/four-weeks', isAuthenticated, async (req, res) => {
    const departmentId = req.body.department_id || req.session.user.department_id;
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

router.get('/api/closed-days', isAuthenticated, async (req, res) => {
    try {
        const [closedDays] = await db.promise().query(`SELECT * FROM closed_days`);
        res.status(200).json(closedDays);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/api/bookings/book-shift', isAuthenticated, async (req, res) => {
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

        const [[{ spotsLeft }]] = await db
            .promise()
            .query(`SELECT COUNT(*) as spotsLeft FROM desk_bookings WHERE shift = ? AND date = ? AND department_id = ?`, [shift, date, user.department_id]);

        const [[{ num_desks }]] = await db.promise().query(`SELECT num_desks FROM departments WHERE id = ?`, [user.department_id]);

        if (spotsLeft >= num_desks) {
            return res.status(409).json({ message: 'No spots left for this shift.' });
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

router.post('/api/closed-days', isAuthenticated, isAdmin, async (req, res) => {
    const { start_date, end_date, reason } = req.body;
    try {
        const result = await db.promise().query(`INSERT INTO closed_days (start_date, end_date, reason) VALUES (?, ?, ?)`, [start_date, end_date, reason]);
        if (result) {
            res.status(201).json({ message: 'Closed period added successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/api/waitlist/join', isAuthenticated, async (req, res) => {
    const user_id = req.session.user.user_id;
    const userDepartmentId = req.session.user.department_id;
    const { shift_type } = req.body;
    const shift_date = moment(req.body.shift_date, 'DD-MM-YYYY').format('YYYY-MM-DD');
    try {
        const [existing] = await db
            .promise()
            .query('SELECT id FROM booking_wait_list WHERE user_id=? AND shift=? AND date=?', [user_id, shift_type, shift_date]);
        if (existing.length > 0) {
            res.status(409).json({ message: 'User already on waitlist for given shift type' });
        }
        const result = await db
            .promise()
            .query(`INSERT INTO booking_wait_list (user_id, date, shift, department_id) VALUES (?, ?, ?, ?)`, [
                user_id,
                shift_date,
                shift_type,
                userDepartmentId,
            ]);
        if (result) {
            res.status(200).json({ message: 'Successfully joined waitlist' });
            io.emit('waitlistUpdate');
        } else {
            res.status(400).json({ error: 'Joining waitlist failed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
        console.log(err);
    }
});

router.delete('/api/waitlist/cancel', isAuthenticated, async (req, res) => {
    const id = req.body.waitlist_id;
    try {
        const [result] = await db.promise().query(`DELETE FROM booking_wait_list WHERE id = ?`, [id]);
        if (result) {
            res.status(200).json({ message: 'Succesfully removed yourself from waitlist' });
            io.emit('waitlistUpdate');
        } else {
            res.status(400).json({ message: 'Nothing found under the given waitlist_id' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.delete('/api/bookings/cancel-shift', isAuthenticated, async (req, res) => {
    const bookingId = req.body.booking_id;

    try {
        checkForWaitlist(bookingId);
        const [result] = await db.promise().query(`DELETE FROM desk_bookings WHERE id=?`, [bookingId]);

        if (result) {
            io.emit('bookingUpdate');
            res.status(200).json({ message: 'Booking successfully canceled' });
        } else {
            res.status(400).json({ error: 'Booking cancelation failed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/api/closed-days/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().query(`DELETE FROM closed_days WHERE id = ?`, [id]);
        res.status(200).json({ message: 'Closed days removed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
