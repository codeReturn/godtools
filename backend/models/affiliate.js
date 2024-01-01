const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const affiliateSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: String, required: true },
  email: { type: String, required: true },
  balance: { type: Number, default: 0 },
  orders: { type: Schema.Types.Mixed }
});

module.exports = mongoose.model('Affiliate', affiliateSchema);
