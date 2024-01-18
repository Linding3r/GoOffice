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
        res.status(500).send('Internal Server Error:', err);
    }
});

router.put('/api/user-updates/read/:id', isAuthenticated, async (req, res) => {
    const updateId = req.params.id;
    try {
        await db.promise().query(`UPDATE user_updates SET has_read = 1 WHERE id = ?`, [updateId]);
        res.status(200).send({ message: 'Update marked as read' });
        io.emit('updateNotification');
    } catch (err){
        res.status(500).send('Internal Server Error: ', err);
    }
});
export default router;
