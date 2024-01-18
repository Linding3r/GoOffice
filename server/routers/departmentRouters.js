import { Router } from 'express';
import db from '../database/connection.js';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';

const router = Router();

router.get('/api/departments', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [departments] = await db.promise().query(`SELECT * FROM departments`);
        res.status(200).json(departments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/api/departments/:id', isAuthenticated, isAdmin, async (req, res) => {
    const desksNumber = req.body.value;
    const departmentId = parseInt(req.params.id);
    try {
        const result = await db.promise().query(`UPDATE departments SET num_desks=? WHERE id=?`, [desksNumber, departmentId]);
        if(result){
        res.status(200).json({ message: 'Department has been updated' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating the department' });
    }
});

router.post('/api/departments')

export default router;
