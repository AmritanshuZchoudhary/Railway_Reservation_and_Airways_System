const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user_id = Number(decoded.user_id);
    req.role = decoded.role;
    req.user = { user_id: req.user_id, role: req.role };
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }
  return next();
}

module.exports = { verifyToken, requireAdmin };
