import db from '../database/connection.js';
import { Router } from 'express';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';

const router = Router();


router.get('/api/logs', isAuthenticated, isAdmin, async, (res, req) => {
    //get logs, have to see how I will do this if I'm going to do it by date or time
})

export default router;
