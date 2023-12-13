import { config } from 'dotenv';
config();

import express from 'express';
const app = express();

import session from 'express-session';
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
        sameSite: 'lax',
    })
);

import path from 'path';
app.use(express.static(path.resolve('../client/dist')));

import cors from 'cors';
app.use(
    cors({
        credentials: true,
        origin: true,
    })
);

import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const server = Server(app);
export const io = new SocketIOServer(server);

io.on('connection', socket => {
    socket.on('disconnect', () => {});
});

import helmet from 'helmet';
app.use(helmet());

import { rateLimit } from 'express-rate-limit';

app.use(express.json());

const allRoutesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 500,
    standardHeaders: 'draft-7', 
    legacyHeaders: false, 
});

app.use(allRoutesLimiter);

const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    limit: 50,
    standardHeaders: 'draft-7', 
    legacyHeaders: false, 
});

app.use('/api/auth/', authRateLimiter);

import authRouters from './routers/authRouters.js';
app.use(authRouters);

import loginOutRouters from './routers/loginOutRouters.js';
app.use(loginOutRouters);

import signupRouters from './routers/signupRouters.js';
app.use(signupRouters);

import nodemailerRouters from './routers/nodemailerRouters.js';
app.use(nodemailerRouters);

import bookingRouters from './routers/scheduleRouters.js';
app.use(bookingRouters);

import userRouters from './routers/userRouters.js';
app.use(userRouters);

import departmentRouters from './routers/departmentRouters.js';
app.use(departmentRouters);

import newsRouters from './routers/newsRouters.js';
app.use(newsRouters);

app.get('*', (req, res) => {
    res.sendFile(path.resolve('../client/dist/index.html'));
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
