require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'auth-service', status: 'ok' }));
 
app.use('/api/auth', authRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`auth-service berjalan di http://localhost:${PORT}`);
});