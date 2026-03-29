const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'envoys-secret-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const login = (password) => {
    if (password === ADMIN_PASSWORD) {
        return { 
            token: signToken({ role: 'admin' }), 
            role: 'admin' 
        };
    }
    return null;
};

module.exports = {
  authenticate,
  signToken,
  login,
  JWT_SECRET
};
