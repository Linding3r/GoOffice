import { Router } from 'express';
import db from '../database/connection.js';
import { io } from '../app.js';
import { isAuthenticated } from '../util/checkAuth.js';

const router = Router();

router.get('/api/users/get-all', async (req, res) => {
    try{
    const [users] = await db.promise().query('SELECT id, name, is_admin, is_fulltime, department_id FROM users;');
    if(users.length > 0){
        res.json({ users });
    } else {
        res.send({ data: "No users to be found"})
    }
    } catch (error){
        res
    }
});

router.post('/api/users/update-user', async (req, res) => {
    const user = req.body.user;
});
export default router;
