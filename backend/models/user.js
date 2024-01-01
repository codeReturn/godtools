const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  rank: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  discord: { type: String },
  telegram: { type: String },
  affcode: { type: String },
  licenses: { type: Schema.Types.Mixed },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
