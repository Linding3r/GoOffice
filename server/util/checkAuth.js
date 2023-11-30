export function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized: No session available' });
    }
}

export function isAdmin(req, res, next) {
    if (req.session.user.is_admin === 1) {
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}