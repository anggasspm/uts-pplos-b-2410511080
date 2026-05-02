require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const proxy      = require('express-http-proxy');
const jwt        = require('jsonwebtoken');
 
const app  = express();
const PORT = process.env.PORT || 8000;
 
app.use(cors());
app.use(express.json());
 
// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || '60'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Terlalu banyak request, coba lagi dalam 1 menit' },
});
app.use(limiter);
 
// JWT Validation Middleware
const PUBLIC_PATHS = [
  { method: 'POST', path: '/api/auth/register' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/refresh' },
  { method: 'GET',  path: '/api/auth/oauth/google' },
  { method: 'GET',  path: '/api/auth/oauth/google/callback' },
  { method: 'GET',  path: '/api/events' },   
  { method: 'GET',  path: '/api/categories'}
];
 
function isPublic(method, path) {
  return PUBLIC_PATHS.some(p => {
    const methodMatch = p.method === method;
    const pathMatch   = path.startsWith(p.path);
    return methodMatch && pathMatch;
  });
}
 
function gatewayJwtMiddleware(req, res, next) {
  if (isPublic(req.method, req.path)) return next();
 
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }
 
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    req.headers['x-user-id']    = decoded.sub;
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Token tidak valid' });
  }
}
 
app.use(gatewayJwtMiddleware);
 
// Health check
app.get('/health', (req, res) => res.json({ service: 'gateway', status: 'ok' }));
 
// Routing Table 
// /api/auth/ 
app.use('/api/auth', proxy(process.env.AUTH_SERVICE_URL, {
  proxyReqPathResolver: req => '/api/auth' + req.url,
}));
 
// /api/events/dan /api/tickets/
app.use('/api/events', proxy(process.env.TICKET_SERVICE_URL, {
  proxyReqPathResolver: req => '/api/events' + req.url,
}));
app.use('/api/tickets', proxy(process.env.TICKET_SERVICE_URL, {
  proxyReqPathResolver: req => '/api/tickets' + req.url,
}));
app.use('/api/categories', proxy(process.env.TICKET_SERVICE_URL, {
  proxyReqPathResolver: req => '/api/categories' + req.url,
}));

// /api/orders/
app.use('/api/orders', proxy(process.env.PAYMENT_SERVICE_URL, {
  proxyReqPathResolver: req => '/api/orders' + req.url,
}));
 
// 404
app.use((req, res) => res.status(404).json({ message: 'Route tidak ditemukan di gateway' }));
 
app.listen(PORT, () => {
  console.log(`API Gateway berjalan di http://localhost:${PORT}`);
  console.log('Routing:');
  console.log(`  /api/auth    → ${process.env.AUTH_SERVICE_URL}`);
  console.log(`  /api/events  → ${process.env.TICKET_SERVICE_URL}`);
  console.log(`  /api/tickets → ${process.env.TICKET_SERVICE_URL}`);
  console.log(`  /api/orders  → ${process.env.PAYMENT_SERVICE_URL}`);
});
 