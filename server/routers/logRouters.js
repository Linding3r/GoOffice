import db from '../database/connection.js';
import { Router } from 'express';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';

const router = Router();


router.get('/api/logs/:hours', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const hours = parseInt(req.params.hours) * 60 * 60 * 1000;
        const reqTime = new Date(Date.now() - hours);
        const currentTime = new Date(Date.now());

        const [logs] = await db.promise().query(
            'SELECT * FROM logs WHERE timestamp BETWEEN ? AND ?',
            [reqTime, currentTime]
        );

        res.status(200).json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


export default router;
