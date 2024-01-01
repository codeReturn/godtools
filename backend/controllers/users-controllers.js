const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Reset = require('../models/reset');
const Affiliate = require('../models/affiliate');

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password, discord, telegram, affcode } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  let existingAffiliate;
  try {
    existingAffiliate = await Affiliate.findOne({ code: affcode });
  } catch (err) {
    const error = new HttpError(
      'Error while finding affiliate code.',
      500
    );
    return next(error);
  }

  if(affcode && !existingAffiliate) {
    const error = new HttpError(
      'Affiliate dont exist!',
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    discord: discord,
    telegram: telegram,
    affcode: affcode
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      'godtools_tok',
      { expiresIn: 3600000 }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      'godtools_tok',
      { expiresIn: 31536000000 }
    );
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

const getuserbyid = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findOne({'_id': userId}, '-password').sort({ _id: -1 });
  } catch (err) {
    const error = new HttpError(
      'Error!',
      500
    );
    return next(error);
  }

  return res.json({ user });
};

const updatePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const { oldpassword, newpassword } = req.body;
  const uid = req.params.uid;

  let user;
  try {
    user = await User.findById(uid);
  } catch (err) {
    const error = new HttpError(
      'Error while finding user!',
      500
    );
    return next(error);
  }

  if (user.id.toString() !== req.userData.userId) {
    const error = new HttpError('#401', 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(oldpassword, user.password);
  } catch (err) {
    const error = new HttpError(
      'Error while crypting password!',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Old password is not correct!',
      403
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(newpassword, 12);
  } catch (err) {
    const error = new HttpError(
      'Error while hashing password!',
      500
    );
    return next(error);
  }

  user.password = hashedPassword;

  try {
    await user.save({
      validateModifiedOnly: true,
    });
  } catch (err) {
    const error = new HttpError(
      'Error while updating password!',
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const updateSocials = async (req, res, next) => {

  const { discord, telegram } = req.body;
  const uid = req.params.uid;

  let user;
  try {
    user = await User.findById(uid);
  } catch (err) {
    const error = new HttpError(
      'Error while finding user!',
      500
    );
    return next(error);
  }

  if (user.id.toString() !== req.userData.userId) {
    const error = new HttpError('#401', 401);
    return next(error);
  }

  user.discord = discord;
  user.telegram = telegram;

  try {
    await user.save({
      validateModifiedOnly: true,
    });
  } catch (err) {
    const error = new HttpError(
      'Error while updating socials!',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'global_success' });
};

const resetpassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some error', 422)
    );
  }

  const nodemailer = require("nodemailer");
  const smtpTransport = require('nodemailer-smtp-transport');

  const uniqid = require('uniqid');
  const link = uniqid();
  const { email } = req.body;
  
  const createdReset = new Reset({
    email,
    link: link,
    date: new Date().getTime()
  });  

  let checkuser;
  try {
    checkuser = await User.findOne({'email': email});
  } catch (err) {}

  if(!checkuser){
    const error = new HttpError(
      'This profile dont exist!',
      500
    );
    return next(error);   
  }

  let transporter = nodemailer.createTransport(smtpTransport({
    host: 'mail.san-company.com',
    port: 465,
    secure: true,
    auth: {
      user: 'info@san-company.com',
      pass: 'bjRM}L(cl8=M'
    },
    tls: {
        rejectUnauthorized: false
    }
  }));

  let mailOptions = {
    from: 'info@san-company.com',
    to: email,
    subject: 'GodTools | Reset Password',
    html: `<h3>GodTools | Reset Password</h3> <hr /> <b>Hi ${email},</b> <p>You have been request to change your password on your account. If you didn't make this request, please disregard this email.</p> <p>The session will expire after 1 hour.</p> <b>http://localhost:5000/resetpasswordupdate/${link}</b>`
  };

  transporter.sendMail(mailOptions, function(err, info){
    if (err) {
      console.log(err);

      const error = new HttpError(
        'We got some error while sending email, try again!',
        500
      );
      return next(error);
    }
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdReset.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      'Error!',
      500
    );
    return next(error);
  }

  res.status(201).json({ message: 'sended' });  
};

const resetpasswordupdate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some error!', 422)
    );
  }

  const { newpassword, repeatpassword, link } = req.body;
  
  let checklink;
  try {
    checklink = await Reset.findOne({'link': link})
  } catch (err) {}

  if(!checklink){
    const error = new HttpError(
      'No results!',
      500
    );
    return next(error);   
  }

  let db_date = parseInt(checklink.date) + 1000 * 60 * 60;
  let date_now = new Date().getTime();

  if(date_now > db_date || checklink.status === 1){
    const error = new HttpError(
      'This session is expired!',
      500
    );
    return next(error);      
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(newpassword, 12);
  } catch (err) {
    const error = new HttpError(
      'Error password!',
      500
    );
    return next(error);
  }

  let user;
  let reset;
  if(newpassword === repeatpassword){
    const filter = { email: checklink.email };
    const update = { password: hashedPassword};

    try {
      user = await User.findOneAndUpdate(filter, update);
      reset = await Reset.findOneAndUpdate({link: link}, {status: 1})
    } catch (err) {
      const error = new HttpError(
        'Error!',
        500
      );
      return next(error);
    }
  
    return res.json({ message: 'updated' });
  } else {
    const error = new HttpError(
      'Passwords do not match!',
      500
    );
    return next(error);      
  }
};

const getlink = async (req, res, next) => {
  const link = req.params.link;

  let linkinfo;
  try {
    linkinfo = await Reset.findOne({'link': link})
  } catch (err) {
    console.log(err)
  }

  let linkmessage;
  let fullerror;

  if(!linkinfo){
      linkmessage = 'noresult';
      fullerror = 'No results for provided link!';
  } else {
      let db_date = parseInt(linkinfo.date) + 1000 * 60 * 60;
      let date_now = new Date().getTime();

      if(date_now > db_date){
          linkmessage = 'expired';
          fullerror = 'This link is expired!';   
      }

      if(linkinfo.status === 1){
          linkmessage = 'finished';
          fullerror = 'This link is finished!';
      }
  }

  res.json({ message: linkmessage, fullerror: fullerror });
};

exports.signup = signup;
exports.login = login;
exports.getuserbyid = getuserbyid;
exports.updatePassword = updatePassword;
exports.updateSocials = updateSocials;
exports.resetpassword = resetpassword;
exports.resetpasswordupdate = resetpasswordupdate;
exports.getlink = getlink;