import { Router } from 'express';
import db from '../database/connection.js';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';

const router = Router();

router.get('/api/news/get-all', isAuthenticated, async (req, res) => {
    const userId = req.session.user.user_id;
    try {
        const query = `
            SELECT n.*, IFNULL(unr.has_read, 0) as has_read
            FROM news n
            LEFT JOIN users_news_read unr ON n.id = unr.news_id AND unr.user_id = ?
            ORDER BY n.time DESC;`;

        const [news] = await db.promise().query(query, [userId]);

        if (news.length > 0) {
            res.status(200).json({ news });
        } else {
            res.status(204).json({ message: 'No news to be found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all news' });
    }
});

router.get('/api/news/get-unread-number', isAuthenticated, async (req, res) => {
    const userId = req.session.user.user_id;
    try {
        const [number] = await db
            .promise()
            .query(
                `SELECT COUNT(n.id) AS unread_news_count FROM go_office.news n WHERE n.time > (SELECT created FROM go_office.users WHERE id = ?) AND n.id NOT IN (SELECT news_id FROM go_office.users_news_read WHERE user_id = ? AND has_read = 1)`,
                [userId, userId]
            );

        if (number[0].unread_news_count > 0) {
            res.status(200).json({ number: number[0].unread_news_count });
        } else {
            res.status(204).json({ message: 'No unread news'})
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unread news number' });
    }
});

router.post('/api/news/read/:newsId', isAuthenticated, async (req, res) => {
    const userId = req.session.user.user_id;
    const newsId = req.params.newsId;

    try {
        const updateQuery = `
        INSERT INTO users_news_read (news_id, user_id, has_read) VALUES (?, ?, 1);
    `;
        await db.promise().query(updateQuery, [newsId, userId]);
        io.emit('newsNotification')
        res.status(200).json({ message: 'News marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating read status' });
    }
});

router.post('/api/news/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, description } = req.body;

        const [result] = await db.promise().query('INSERT INTO news (title, description) VALUES (?, ?)', [title, description]);

        if (result) {
            res.status(200).json({ message: 'News added successfully' });
            io.emit('newsUpdate');
            io.emit('newsNotification')
        }
    } catch (error) {
        res.status(500).json({ message: 'Error adding news' });
    }
});

export default router;
