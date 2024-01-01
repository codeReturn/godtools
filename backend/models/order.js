const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    author: {type: mongoose.Schema.ObjectId, ref: 'User'},
    price: { type: Number, required: true },
    status: { type: Boolean, required: true },
    products: { type: Schema.Types.Mixed, required: true },
    date : { type : Date, default: Date.now },
    request_status: { type: Number, default: 0 },
    request_message: { type: String },
    address: { type: String },
    crypto_info: { type: Schema.Types.Mixed }
});

module.exports = mongoose.model('Order', orderSchema);
