import { Router } from 'express';
import { passwordHasher } from '../util/passwordencryption.js';
import db from '../database/connection.js';
const router = Router();

async function doesEmailExist(email){
    const result = await db.all(`SELECT * FROM users WHERE email = ?;`, email);
    return result.length > 0;
} 


router.post('/api/auth/signup', async (req, res) => {
    const { email, password, name } = req.body;
    let user = [email, password, name];

    if(await doesEmailExist(email)){
        res.status(409).json({ message: 'User with that email already exists.'})
    } else {
    if (user) {
        const result = await db.run(`INSERT INTO users (email, name, password) VALUES (?,?,?);`, [email, name, await passwordHasher(password)])
        if(result){
            res.status(200).json({ message: 'Signup succefull' })
        } else {
            res.status(400).json({ error: 'Signup failed' });
        }
    } else {
        res.status(400).json({ error: 'Missing argument' });
    }
}
});


export default router;
