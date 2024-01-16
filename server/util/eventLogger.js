import db from '../database/connection.js';

export async function requestLogger(req, res, next) {
    const start = Date.now();
    let user = null;
    if(req.session.user){
        user = req.session.user.user_id
    }

    function logger() {
        const duration = Date.now() - start;
        if (req.path.includes('/api/')) {
            const log = {
                method: req.method,
                path: req.path,
                ip: req.ip,
                status: res.statusCode,
                time: duration,
                session_user: user
            };
            db.promise().query(`INSERT INTO logs (path, methode, ip, status, response_time, session_user_id) VALUES (?,?,?,?,?,?)`, [log.path, log.method, log.ip, log.status, log.time, log.session_user]);
        }
    }
    res.on('finish', logger);
    next();
}


