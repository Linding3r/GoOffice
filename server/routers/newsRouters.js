import { Router } from 'express';
import db from '../database/connection.js';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';

const router = Router();


router.get('/api/news/get-all', async (req, res) => {
    try{
        const [news] = await db.promise().query('SELECT * FROM news;');
        if(news.length > 0){
            res.status(200).json({ news });
        } else {
            res.status(200).json({ message: 'No news to be found' });
        }
        } catch (error){
            res.status(500).json({ message: 'Error fetching all news' });
        }
});

router.post('/api/news/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, description } = req.body;

        const [result] = await db.promise().query('INSERT INTO news (title, description) VALUES (?, ?)', [title, description]);

        const [newNews] = await db.promise().query('SELECT * FROM news WHERE id = ?', [result.insertId]);
        io.emit('newsUpdate', newNews[0]);

        res.status(200).json({ message: 'News added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding news' });
    }
});


export default router;