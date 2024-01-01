const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  service: { type: String, required: true },
  service_info: { type: Schema.Types.Mixed, required: true },
  price: { type: Number, required: true },
  active: { type: Boolean, default: true },
  borders: { type: Schema.Types.Mixed }
});

module.exports = mongoose.model('Product', productSchema);
