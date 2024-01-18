import db from '../database/connection.js';
import { checkPassword } from '../util/passwordencryption.js';
import { Router } from 'express';

const router = Router();

router.post('/api/auth/login', async (req, res) => {
    try {
        const [users] = await db.promise().query(`SELECT * FROM users WHERE email = ?;`, [req.body.email]);
        const user = users[0];
        if (!user) {
            res.status(404).json({ message: `No user found with email: ${req.body.email}` });
        } else {
            if (await checkPassword(req.body.password, user.password)) {
                req.session.isAuthenticated = true;
                req.session.user = { name: user.name, is_admin: user.is_admin, user_id: user.id, department_id: user.department_id, is_fulltime: user.is_fulltime };
                req.session.save(err => {
                    if (err) {
                        throw err;
                    }
                    res.status(200).json({ message: 'Login successful', name: user.name });
                });
            } else {
                res.status(401).json({ message: 'Wrong password or email' });
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.status(500).json({ message: 'Could not log out' });
        } else {
            res.clearCookie('connect.sid', { path: '/' });
            res.status(200).json({ message: 'Logout successful' });
        }
    });
});

export default router;
