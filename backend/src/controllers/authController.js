const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function publicUser(row) {
  return {
    user_id: row.user_id,
    full_name: row.full_name,
    email: row.email,
    role: row.role
  };
}

function makeToken(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h', issuer: 'railway-reservation-system' }
  );
}

exports.register = async (req, res, next) => {
  try {
    const fullName = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (fullName.length < 2 || fullName.length > 120) {
      return res.status(400).json({ error: 'Please enter a name between 2 and 120 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: 'Password must contain 8–72 characters.' });
    }

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, \'PASSENGER\')',
      [fullName, email, await bcrypt.hash(password, 12)]
    );
    const user = { user_id: result.insertId, full_name: fullName, email, role: 'PASSENGER' };
    return res.status(201).json({ message: 'Account created successfully.', token: makeToken(user), user });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const [users] = await db.query(
      'SELECT user_id, full_name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const userRow = users[0];
    const validPassword = userRow ? await bcrypt.compare(password, userRow.password_hash) : false;
    if (!validPassword) return res.status(401).json({ error: 'Email or password is incorrect.' });

    const user = publicUser(userRow);
    return res.json({ message: 'Signed in successfully.', token: makeToken(user), user });
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, role FROM users WHERE user_id = ? LIMIT 1',
      [req.user_id]
    );
    if (!rows.length) return res.status(401).json({ error: 'Account not found. Please sign in again.' });
    return res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    return next(error);
  }
};
