const axios = require('axios');
const { UserModel, TokenModel } = require('../models/AuthModel');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtHelper');

function refreshExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

// GET /api/auth/oauth/google
function googleRedirect(req, res) {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'consent',
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(url);
}

// GET /api/auth/oauth/google/callback
async function googleCallback(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.status(400).json({ message: 'OAuth dibatalkan atau gagal' });
  }

  try {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
      grant_type:    'authorization_code',
    });

    const { access_token: googleToken } = tokenRes.data;

    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${googleToken}` },
    });

    const { id: oauth_id, name, email, picture: avatar } = profileRes.data;

    const user = await UserModel.upsertOAuth({
      name,
      email,
      oauth_provider: 'google',
      oauth_id,
      avatar,
    });

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await TokenModel.deleteRefreshToken(user.id);
    await TokenModel.saveRefreshToken(user.id, refreshToken, refreshExpiresAt());

    return res.status(200).json({
      message:       'Login Google berhasil',
      access_token:  accessToken,
      refresh_token: refreshToken,
      user: {
        id:     user.id,
        name:   user.name,
        email:  user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Google OAuth error:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Gagal autentikasi dengan Google' });
  }
}

module.exports = { googleRedirect, googleCallback };