const jwt = require('jsonwebtoken');

const authMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(403).json({success: false, msg:'Token is required'});

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(401).json({success: false, msg:'Invalid Token'});
            }

            req.user = user;

            if (allowedRoles.length && !allowedRoles.includes(user.role)) {
                return res.status(403).json({success: false, msg:'Access denied. Insufficient permissions.'});
            }

            next();
        });
    };
};

module.exports = authMiddleware;
