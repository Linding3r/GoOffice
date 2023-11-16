import { config } from 'dotenv';
config();

import express from 'express';
const app = express();

import session from 'express-session';

//import connectSqlite from 'connect-sqlite3';
//const SQLiteStore = connectSqlite(session);

import path from "path"
app.use(express.static(path.resolve("../client/dist")))

import cors from "cors";
app.use(cors({
    credentials: true,
    origin: true
}));

import helmet from 'helmet';
app.use(helmet());


import { rateLimit } from 'express-rate-limit';

app.use(express.json());

app.use(session({
    //store: new SQLiteStore({ db: 'sessions.db' }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
    sameSite: 'lax',
}));

const allRoutesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200,
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

app.use(allRoutesLimiter);

const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    limit: 20,
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  });
  
app.use('/api/auth/', authRateLimiter);

import authRouters from './routers/authRouters.js'
app.use(authRouters);

import loginOutRouters from './routers/loginOutRouters.js'
app.use(loginOutRouters) 

import signupRouters from './routers/signupRouters.js'
app.use(signupRouters)

import nodemailerRouters from './routers/nodemailerRouters.js'
app.use(nodemailerRouters)

app.get("*", (req, res) => {
    res.sendFile(path.resolve("../client/dist/index.html"))
})

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
