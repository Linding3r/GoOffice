import { Router } from 'express';
const router = Router();

import { config } from 'dotenv';
config();

import db from '../database/connection.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';



router.post('/api/auth/request-password-reset', async (req, res) => {
    const { email } = req.body;
    const user = await db.get(`SELECT * FROM users WHERE email = ?`, email);

    if (user) {
        const resetToken = crypto.randomBytes(20).toString('hex');
        const expireTime = Date.now() + 3600000;

        await db.run(`UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?`, [resetToken, expireTime, email]);

        const resetLink = `http://localhost:8080/reset-password?token=${resetToken}`;
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const html = `<p>Please click on the following link, or paste this into your browser to complete the process:</p><br><br><a href="${resetLink}">Reset Link</a>`;
        try {
            await transporter.sendMail({
                from: '"Mandatory II" <no-reply@lindinger.io>',
                to: email,
                subject: `Password Reset`,
                html: html,
            });

            res.status(200).json({ success: true, message: 'Reset password link sent to email' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error sending email' });
        }
    } else {
        res.status(404).json({ message: `No user found with email: ${email}` });
    }
});

export default router;
