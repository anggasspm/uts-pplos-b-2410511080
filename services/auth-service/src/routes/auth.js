const express = require('express');
const router  = express.Router();

const { register, login, refresh, logout, me } = require('../controllers/AuthController');
const { googleRedirect, googleCallback }        = require('../controllers/OAuthController');
const jwtMiddleware = require('../middlewares/jwtMiddleware');

router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refresh);

router.get('/oauth/google',          googleRedirect);
router.get('/oauth/google/callback', googleCallback);

router.post('/logout', jwtMiddleware, logout);
router.get('/me',      jwtMiddleware, me);

module.exports = router;