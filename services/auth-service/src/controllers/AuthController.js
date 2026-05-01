const bcrypt = require('bcryptjs');
const { UserModel, TokenModel } = require('../models/AuthModel');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtHelper');

function refreshExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password, password_confirmation } = req.body;

  if (!name || !email || !password) {
    return res.status(422).json({ message: 'name, email, dan password wajib diisi' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(422).json({ message: 'Format email tidak valid' });
  }

  if (password.length < 8) {
    return res.status(422).json({ message: 'Password minimal 8 karakter' });
  }

  if (password_confirmation && password !== password_confirmation) {
    return res.status(422).json({ message: 'Password dan konfirmasi password tidak cocok' });
  }

  try {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await UserModel.create({ name, email, password: hashed });

    return res.status(201).json({ message: 'Registrasi berhasil', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ message: 'email dan password wajib diisi' });
  }

  try {
    const user = await UserModel.findByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await TokenModel.deleteRefreshToken(user.id); // hapus token lama
    await TokenModel.saveRefreshToken(user.id, refreshToken, refreshExpiresAt());

    return res.status(200).json({
      access_token:  accessToken,
      refresh_token: refreshToken,
      expires_in:    900, // 15 menit dalam detik
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/refresh
async function refresh(req, res) {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(422).json({ message: 'refresh_token wajib diisi' });
  }

  try {
    const decoded = verifyRefreshToken(refresh_token);
    const user = await UserModel.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await TokenModel.deleteRefreshToken(user.id);
    await TokenModel.saveRefreshToken(user.id, newRefreshToken, refreshExpiresAt());

    return res.status(200).json({
      access_token:  newAccessToken,
      refresh_token: newRefreshToken,
      expires_in:    900,
    });
  } catch (err) {
    return res.status(401).json({ message: 'Refresh token tidak valid atau expired' });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  try {
    const jti = req.user.jti;
    const exp = new Date(req.user.exp * 1000);

    await TokenModel.blacklistJti(jti, exp);
    await TokenModel.deleteRefreshToken(req.user.sub);

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const user = await UserModel.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, refresh, logout, me };