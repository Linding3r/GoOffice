import { Router } from 'express';
import { passwordHasher } from '../util/passwordencryption.js';
import db from '../database/connection.js';
const router = Router();


router.get('/api/checkAuth', (req, res) => {
    if (req.session.isAuthenticated) {
        res.status(200).json({ isAuthenticated: true, name: req.session.user.name, is_admin: req.session.user.is_admin, user_id: req.session.user.user_id, department_id: req.session.user.department_id });
    } else {
        res.status(200).json({ isAuthenticated: false });
    }
});

router.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const currentTime = Date.now();
  try {
      const [user] = await db.promise().query(`SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > ?`, [token, currentTime]);
      if (!user || user.length === 0) {
          return res.status(400).send('Password reset token is invalid or has expired.');
      }

      const hashedPassword = await passwordHasher(newPassword);

      await db.promise().query(`UPDATE users SET password = ?, reset_password_token = ?, reset_password_expires = ? WHERE id = ?`, [hashedPassword, null, null, user[0].id]);

      res.status(200).json({ message: 'Password successfully reset.' });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

export default router;