import { Router } from 'express';
import db from '../database/connection.js';
import moment from 'moment';
import { io } from '../app.js';
import { isAuthenticated } from '../util/checkAuth.js';

const router = Router();

router.get('/api/office-manager/employees/at-office', isAuthenticated, async (req, res) => {

})

export default router;