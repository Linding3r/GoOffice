import db from '../database/connection.js';

export async function requestLogger(req, res, next) {
    if(req.path.includes('/api/')){
    const log = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        status: res.statusCode,
    };
    await db.promise().query(`INSERT INTO logs (path, methode, ip, status) VALUES (?,?,?,?)`,[log.path, log.method, log.ip, log.status]);
    }
    next();
}


