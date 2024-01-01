const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const licenseSchema = new Schema({
  title: { type: String, required: true },
  key: { type: String, required: true },
  date : { type : Date, default: Date.now },
  status: { type: Number, default: 0 }
});

module.exports = mongoose.model('License', licenseSchema);
