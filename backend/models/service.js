const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  products: [{ type: Schema.Types.Mixed, required: true, ref: 'Product' }]
});

module.exports = mongoose.model('Service', serviceSchema);
