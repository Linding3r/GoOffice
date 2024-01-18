import { Router } from 'express';
import db from '../database/connection.js';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';

const router = Router();

router.get('/api/users/get-all', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [users] = await db.promise().query('SELECT id, name, is_admin, is_fulltime, department_id, email FROM users;');
        if (users.length > 0) {
            res.json({ users });
        } else {
            res.status(200).json({ message: 'No users to be found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all users' });
    }
});

router.get('/api/users/vacations', /*isAuthenticated,*/ async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const [vacations] = await db.promise().query('SELECT * FROM vacation_plans WHERE user_id = ?', [userId]);
        res.status(200).json(vacations);
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

router.post('/api/users/vacation-plans', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const { start_date, end_date } = req.body;
        await db.promise().execute(`INSERT INTO vacation_plans (user_id, start_date, end_date) VALUES (?, ?, ?)`, [userId, start_date, end_date]);
        res.status(200).json({ message: 'Vacation plan added successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    const userReq = req.body.user;
    try {
        await db
            .promise()
            .query(`UPDATE users SET is_fulltime=?, is_admin=?, department_id=? WHERE id=?`, [
                userReq.is_fulltime,
                userReq.is_admin,
                userReq.department_id,
                userReq.id,
            ]);
        res.status(200).json({ message: 'User has been updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating the user' });
    }
});

router.put('/api/users/dietary-preferences', isAuthenticated, async (req, res) => {
    try {
        const { isVegetarian, isVegan } = req.body;
        const userId = req.session.user.user_id;
        await db.promise().execute(`UPDATE users SET is_vegetarian = ?, is_vegan = ? WHERE id = ?`, [isVegetarian, isVegan, userId]);

        res.status(200).json({ message: 'Dietary preferences updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/api/users/vacations/:vacationId', isAuthenticated, async (req, res) => {
    try {
        const { vacationId } = req.params;
        await db.promise().execute('DELETE FROM vacation_plans WHERE id = ?', [vacationId]);
        res.status(200).json({ message: 'Vacation deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
