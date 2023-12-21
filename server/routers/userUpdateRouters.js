import { Router } from 'express';
import db from '../database/connection.js';
import moment from 'moment';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';

const router = Router();

router.get('/api/user-updates', isAuthenticated, async (req, res) => {
    const user = req.session.user;
    try {
        const [updates] = await db.promise().query(`SELECT * FROM user_updates WHERE user_id = ? AND has_read = 0`, [user.user_id]);
        if (updates.length > 0) {
            res.status(200).send({ updates });
        } else {
            res.status(204).send({ message: 'No Updates for given user' });
        }
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

router.post('/api/user-updates/read/:id', isAuthenticated, async (req, res) => {
    const updateId = req.params.id;
    try {
        const [result] = await db.promise().query(`UPDATE user_updates SET has_read = 1 WHERE id = ?`, [updateId]);
        if (result.affectedRows > 0) {
            res.status(200).send({ message: 'Update marked as read' });
        } else {
            res.status(204).send({ message: 'No updates with given id' });
        }
    } catch {
        res.status(500).send('Internal Server Error');
    }
});
export default router;
