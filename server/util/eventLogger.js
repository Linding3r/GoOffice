import db from '../database/connection.js';

export async function requestLogger(req, res, next) {
    const start = Date.now();
    let user = null;
    if(req.session.user){
        user = req.session.user.user_id
    }

    function logger() {
        const duration = Date.now() - start;
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        let body = '';
        if (req.method === 'POST' || req.method === 'DELETE' || req.method ==='PUT') {
            if(Object.keys(req.body).length >= 1 && !req.originalUrl.includes('/api/auth/')){
                body = JSON.stringify(req.body)
            }

            const log = {
                method: req.method,
                path: fullUrl,
                body: body,
                status: res.statusCode,
                time: duration,
                session_user: user
            };
            db.promise().query(`INSERT INTO logs (path, method, status, response_time, session_user_id, body) VALUES (?,?,?,?,?,?)`, [log.path, log.method, log.status, log.time, log.session_user, log.body]);
        }
    }
    res.on('finish', logger);
    next();
}


