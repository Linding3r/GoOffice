import { Router } from 'express';
import db from '../database/connection.js';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';

const router = Router();

router.get('/api/users/get-all', isAuthenticated, isAdmin, async (req, res) => {
    try{
    const [users] = await db.promise().query('SELECT id, name, is_admin, is_fulltime, department_id, email FROM users;');
    if(users.length > 0){
        res.json({ users });
    } else {
        res.status(200).json({ message: 'No users to be found' });
    }
    } catch (error){
        res.status(500).json({ message: 'Error fetching all users' });
    }
});

router.get('/api/users/user', isAuthenticated, async (req, res) => {
    try{
        const [user] = await db.promise().query('')
    } catch (error){
        res.status(500).json({ message: 'Error fetching user data'})
    }
})

router.put('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    const userReq = req.body.user;
    try{
        await db.promise().query(`UPDATE users SET is_fulltime=?, is_admin=?, department_id=? WHERE id=?`, [userReq.is_fulltime, userReq.is_admin, userReq.department_id, userReq.id]);
        res.status(200).json({ message: 'User has been updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating the user' });
    }
});

export default router;
