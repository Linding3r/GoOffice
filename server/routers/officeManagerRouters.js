import { Router } from 'express';
import db from '../database/connection.js';
import { getWeekDateRange } from '../util/weekDateRange.js';
import { isAuthenticated } from '../util/checkAuth.js';

const router = Router();

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
        ) AS status,
        COUNT(DISTINCT CASE WHEN users.is_vegetarian = 1 AND (users.is_fulltime = 1 OR desk_bookings.user_id IS NOT NULL) THEN users.id END) AS vegetarianCount,
        COUNT(DISTINCT CASE WHEN users.is_vegan = 1 AND (users.is_fulltime = 1 OR desk_bookings.user_id IS NOT NULL) THEN users.id END) AS veganCount
    FROM 
        (SELECT DATE_ADD(?, INTERVAL idx DAY) AS bookingDate
         FROM 
            (SELECT 0 idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) days) dates
    LEFT JOIN 
        desk_bookings ON dates.bookingDate = desk_bookings.date
    LEFT JOIN 
        closed_days ON dates.bookingDate BETWEEN closed_days.start_date AND closed_days.end_date
    LEFT JOIN 
        users ON desk_bookings.user_id = users.id OR (users.is_fulltime = 1 AND users.id NOT IN 
            (SELECT user_id FROM vacation_plans 
             WHERE start_date <= dates.bookingDate AND end_date >= dates.bookingDate))
    WHERE 
        dates.bookingDate BETWEEN ? AND ?
    GROUP BY 
        dates.bookingDate;
        `;
        const [results] = await db.promise().query(query, [startDate, startDate, endDate]);
        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
