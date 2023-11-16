import db from '../database/connection.js';
import { checkPassword } from '../util/passwordencryption.js';

import { Router } from 'express';
const router = Router();

router.post('/api/auth/login', async (req, res) => {
    const user = await db.get(`SELECT * FROM users WHERE email = ?;`, req.body.email);
    if (!user) {
        res.status(404).json({ message: `No user found with email: ${req.body.email}` });
    } else {
        if (await checkPassword(req.body.password, user.password)) {
            req.session.isAuthenticated = true;
            req.session.user = { name: user.name, is_admin: user.is_admin};
            res.status(200).json({ message: 'Login successful', name: user.name });
        } else {
            res.status(401).json({ message: 'Wrong password or email' });
        }
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
