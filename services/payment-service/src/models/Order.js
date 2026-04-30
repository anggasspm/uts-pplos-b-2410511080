const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  _id:                { type: String, default: () => require('uuid').v4() },
  user_id:            { type: String, required: true },
  ticket_category_id: { type: String, required: true },
  quantity:           { type: Number, required: true, min: 1 },
  unit_price:         { type: Number, required: true },
  total_price:        { type: Number, required: true },
  status:             { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  payment_method:     { type: String, enum: ['transfer', 'ewallet', 'qris'], default: 'transfer' },
  paid_at:            { type: Date, default: null },
  ticket_ids:         [{ type: String }],
}, { timestamps: true, _id: false });

module.exports = mongoose.model('Order', orderSchema);