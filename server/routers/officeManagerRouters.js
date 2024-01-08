import { Router } from 'express';
import db from '../database/connection.js';
import moment from 'moment';
import { io } from '../app.js';
import { isAuthenticated } from '../util/checkAuth.js';

const router = Router();

function getWeekDateRange(year, weekNum) {
    let janFirst = new Date(year, 0, 1);
    let weekStart = new Date(janFirst.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);
    return { start: weekStart, end: weekEnd };
}

router.get('/api/office/:year/:week', isAuthenticated, async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const week = parseInt(req.params.week);
        const { start, end } = getWeekDateRange(year, week);

        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];

        const query = `
SELECT 
    dates.bookingDate, 
    IF(MAX(closed_days.id) IS NOT NULL, 'Office Closed', 
        COUNT(DISTINCT desk_bookings.user_id) +
        (SELECT COUNT(*) FROM users 
         WHERE is_fulltime = 1 AND id NOT IN 
             (SELECT user_id FROM vacation_plans 
              WHERE start_date <= dates.bookingDate AND end_date >= dates.bookingDate)
        )
    ) AS status
FROM 
    (SELECT DATE_ADD(?, INTERVAL idx DAY) AS bookingDate
     FROM 
        (SELECT 0 idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) days) dates
LEFT JOIN 
    desk_bookings ON dates.bookingDate = desk_bookings.date
LEFT JOIN 
    closed_days ON dates.bookingDate BETWEEN closed_days.start_date AND closed_days.end_date
WHERE 
    dates.bookingDate BETWEEN ? AND ?
GROUP BY 
    dates.bookingDate;
        `;

        const [results] = await db.promise().query(query, [startDate, startDate, endDate]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error during database query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
