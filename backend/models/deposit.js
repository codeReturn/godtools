const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const depositSchema = new Schema({
    author: {type: mongoose.Schema.ObjectId, ref: 'User'},
    pricenofee: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: Boolean, required: true },
    date : { type : Date, default: Date.now },
    deposit_date : { type : Date },
    address: { type: String },
    crypto_info: { type: Schema.Types.Mixed }
});

module.exports = mongoose.model('Deposit', depositSchema);
