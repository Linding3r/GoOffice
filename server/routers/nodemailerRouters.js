import { Router } from 'express';
const router = Router();

import { config } from 'dotenv';
config();

import db from '../database/connection.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

router.post('/api/auth/request-password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.promise().query(`SELECT * FROM users WHERE email = ?`, [email]);
        const user = users[0];

        if (user) {
            const resetToken = crypto.randomBytes(20).toString('hex');
            const expireTime = new Date(Date.now() + 3600000);

            await db.promise().query(`UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?`, [resetToken, expireTime, email]);

            const resetLink = `http://localhost:8080/reset-password?token=${resetToken}`;
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });

            const html = `<p>Please click on the following link to reset your password:</p><br><br><a href="${resetLink}">Reset Link</a>`;
            try {
                await transporter.sendMail({
                    from: '"Go Office" <no-reply@goautonomous.io>',
                    to: email,
                    subject: `Password Reset`,
                    html: html,
                });

                res.status(200).json({ message: 'Reset password link sent to email' });
            } catch (error) {
                res.status(500).json({ message: 'Error sending email' });
            }
        } else {
            res.status(404).json({ message: `No user found with email: ${email}` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error in database operation' });
    }
});

export default router;
