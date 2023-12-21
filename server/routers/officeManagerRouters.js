import { Router } from 'express';
import db from '../database/connection.js';
import moment from 'moment';
import { io } from '../app.js';
import { isAuthenticated, isAdmin } from '../util/checkAuth.js';
import { checkForWaitlistAndBook } from '../util/waitlist.js';

const router = Router();



export default router;