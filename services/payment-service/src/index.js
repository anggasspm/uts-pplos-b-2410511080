require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const orderRoutes = require('./routes/orders');

const app  = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'payment-service', status: 'ok' }));
app.use('/api/orders', orderRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB terhubung');
    app.listen(PORT, () => console.log(`payment-service berjalan di http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Gagal koneksi MongoDB:', err.message);
    process.exit(1);
  });