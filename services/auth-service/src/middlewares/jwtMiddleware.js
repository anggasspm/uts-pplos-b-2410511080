const { verifyAccessToken } = require('../utils/jwtHelper');
const { TokenModel } = require('../models/AuthModel');

async function jwtMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);

    const blacklisted = await TokenModel.isBlacklisted(decoded.jti);
    if (blacklisted) {
      return res.status(401).json({ message: 'Token sudah tidak valid (logout)' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, gunakan refresh token' });
    }
    return res.status(401).json({ message: 'Token tidak valid' });
  }
}

module.exports = jwtMiddleware;