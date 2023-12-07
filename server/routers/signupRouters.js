import { Router } from 'express';
import { passwordHasher } from '../util/passwordencryption.js';
import db from '../database/connection.js';

const router = Router();

async function doesEmailExist(email) {
    const [results] = await db.promise().query(`SELECT * FROM users WHERE email = ?;`, [email]);
    return results.length > 0;
}

router.post('/api/auth/signup', async (req, res) => {
    const { email, password, name } = req.body;

    if (await doesEmailExist(email)) {
        return res.status(409).json({ message: 'User with that email already exists.' });
    } else {
        try {
            const hashedPassword = await passwordHasher(password);
            const [result] = await db.promise().query(`INSERT INTO users (email, name, password, department_id) VALUES (?, ?, ?, ?);`, [email, name, hashedPassword, 6]);
            if (result) {
                res.status(200).json({ message: 'Signup successful' });
            } else {
                res.status(400).json({ error: 'Signup failed' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

export default router;
