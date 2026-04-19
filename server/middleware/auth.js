const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Get token from cookies
    const token = req.cookies.token;

    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const verifyAdmin = (req, res, next) => {
    auth(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Admin only.' });
        }
    });
};

module.exports = auth;
module.exports.verifyAdmin = verifyAdmin;

