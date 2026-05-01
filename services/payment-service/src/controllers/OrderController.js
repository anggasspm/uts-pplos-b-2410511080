const axios  = require('axios');
const Order  = require('../models/Order');

// POST /api/orders — buat order baru (checkout)
async function createOrder(req, res) {
  const { ticket_category_id, quantity, payment_method } = req.body;
    if (!ticket_category_id) {
      return res.status(422).json({ message: 'ticket_category_id wajib diisi' });
    }
    if (!quantity || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return res.status(422).json({ message: 'quantity wajib diisi dan minimal 1' });
    }
    if (quantity > 10) {
      return res.status(422).json({ message: 'quantity maksimal 10' });
    }
    if (payment_method && !['transfer', 'ewallet', 'qris'].includes(payment_method)) {
      return res.status(422).json({ message: 'payment_method harus transfer, ewallet, atau qris' });
    }

  try {
    // Ambil detail kategori tiket dari ticket-service (inter-service call)
    const categoryRes = await axios.get(
  `${process.env.TICKET_SERVICE_URL}/api/categories/${ticket_category_id}`
    );
    const category = categoryRes.data.data;
    const unitPrice = category.price;
    const total     = unitPrice * quantity;

    const order = await Order.create({
      user_id:            req.user.sub,
      ticket_category_id,
      quantity:           Number(quantity),
      unit_price:         unitPrice,
      total_price:        total,
      payment_method:     payment_method || 'transfer',
      status:             'pending',
    });

    return res.status(201).json({
      message:     'Order berhasil dibuat, silakan lakukan pembayaran',
      data:        order,
      payment_info: {
        total_price: total,
        bank:        'BCA',
        va_number:   '8277' + Math.floor(Math.random() * 100000000),
        expires_in:  '1 jam',
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/orders/:id/confirm-payment 
async function confirmPayment(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
  if (order.user_id !== req.user.sub) return res.status(403).json({ message: 'Akses ditolak' });
  if (order.status === 'paid') return res.status(409).json({ message: 'Order sudah dibayar' });
  if (order.status === 'cancelled') return res.status(409).json({ message: 'Order sudah dibatalkan' });

  try {
    // Update status order
    order.status  = 'paid';
    order.paid_at = new Date();
    await order.save();

    // Ticket-service generate tiket
    const ticketRes = await axios.post(
      `${process.env.TICKET_SERVICE_URL}/api/tickets`,
      {
        ticket_category_id: order.ticket_category_id,
        order_id:           order._id,
        user_id:            order.user_id,
        quantity:           order.quantity,
      }
    );

    const tickets = ticketRes.data.data;
    order.ticket_ids = tickets.map(t => t.id);
    await order.save();

    return res.status(200).json({
      message: 'Pembayaran dikonfirmasi, tiket berhasil diterbitkan',
      data:    order,
      tickets,
    });
  } catch (err) {
    console.error('Error konfirmasi pembayaran:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Gagal menerbitkan tiket' });
  }
}

// GET /api/orders/:id
async function getOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
  if (order.user_id !== req.user.sub) return res.status(403).json({ message: 'Akses ditolak' });
  return res.status(200).json({ data: order });
}

// GET /api/orders 
async function listOrders(req, res) {
  const page    = Math.max(parseInt(req.query.page    || '1'),  1);
  const perPage = Math.min(parseInt(req.query.per_page || '10'), 100);
  const skip    = (page - 1) * perPage;

  const filter = { user_id: req.user.sub };
  if (req.query.status) filter.status = req.query.status;

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
  ]);

  return res.status(200).json({
    data: orders,
    pagination: { total, per_page: perPage, current_page: page, last_page: Math.ceil(total / perPage) },
  });
}

module.exports = { createOrder, confirmPayment, getOrder, listOrders };