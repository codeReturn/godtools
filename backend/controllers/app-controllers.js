const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Service = require('../models/service');
const Product = require('../models/product');
const Order = require('../models/order');
const Deposit = require('../models/deposit');
const Article = require('../models/article');
const Affiliate = require('../models/affiliate');
const License = require('../models/license');

const qr = require('qrcode');
const axios = require('axios');

const BigNumber = require('bignumber.js');

let ioInstance;

function initialize(io) {
    ioInstance = io;
}

const getServices = async (req, res, next) => {
    let services;
  
    try {
        services = await Service.find({});
    } catch (err) {
      const error = new HttpError(
        'We got error while fetching services!',
        500
      );
      return next(error);   
    }
  
    res.status(201).json({ services: services })
}

const getArticles = async (req, res, next) => {
    let articles;
  
    try {
        articles = await Article.find({});
    } catch (err) {
      const error = new HttpError(
        'We got error while fetching articles!',
        500
      );
      return next(error);   
    }
  
    res.status(201).json({ articles: articles })
}

const getServiceById = async (req, res, next) => {
    const sid = req.params.sid;

    let service;
    try {
        service = await Service.findOne({'_id': sid});
    } catch (err) {
        const error = new HttpError(
        'Error!',
        500
        );
        return next(error);
    }

    return res.json({ service: service });
}

const searchForm = async (req, res, next) => {
    const search = decodeURI(req.params.search);
  
    let results;
    try {
        results = await Service.find({name: {$regex: `.*${search}.*`, $options: "i"}});
    } catch (err) {
      const error = new HttpError(
        'Error while searching!',
        500
      );
      return next(error);
    }
    
    return res.json({ results: results });
};

const getProductById = async (req, res, next) => {
    const pid = req.params.pid;

    let product;
    try {
        product = await Product.findOne({'_id': pid});
    } catch (err) {
        const error = new HttpError(
        'Error!',
        500
        );
        return next(error);
    }

    return res.json({ product: product });
}

const createOrder = async (req, res, next) => {
    const { price, status, products } = req.body;

    if(!products || price === 0){
        const error = new HttpError(
            'We got some error!1',
            500
        );
        return next(error);
    }

    if(products.length === 0){
      const error = new HttpError(
        'We got some error!x',
        500
      );
      return next(error);
    }

    const createdOrder = new Order({
        author: req.userData.userId, 
        price: price, 
        status: true, 
        request_status: 1,
        products: products
    });
    
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdOrder.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
          'Error while creating order!',
          500
        );
        return next(error);
    }
    
    res.status(201).json({ item: createdOrder });  
}

const getUserOrders = async (req, res, next) => {
    let orders;
    
    try {
        orders = await Order.find({ author: req.userData.userId })
    } catch (err) {
        const error = new HttpError(
            'Error while fetching orders!',
            500
          );
          return next(error);
    }

    res.status(201).json({ orders: orders })
}

const requestCodes = async (req, res, next) => {
    console.log(req.body)
    const { id } = req.body

    let order;
    try {
        order = await Order.findOne({'_id': id});
    } catch (err) {
        const error = new HttpError(
            'Error while fetching order!',
            500
          );
          return next(error);
    }

    if (order.author.toString() !== req.userData.userId) {
        const error = new HttpError('#401', 401);
        return next(error);
    }

    
    order.request_status = 1;

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await order.save();
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
        'We got some error while saving changes!',
        500
        );
        return next(error);
    }

    res.status(200).json({ message: 'global_success' });
}

const fetchTokens = async (req, res, next) => {
    const mainnets = ['btc', 'dash', 'doge', 'ltc', 'eth'];
    res.json({ tokens: mainnets });
};

const getCoinFullName = (symbol) => {
  switch (symbol) {
    case 'btc':
      return 'bitcoin';
    case 'dash':
      return 'dash';
    case 'doge':
      return 'dogecoin';
    case 'ltc':
      return 'litecoin';
    case 'eth':
      return 'ethereum';
    default:
      throw new Error('Invalid token symbol.');
  }
};

const fetchTokenPrice = async (symbol, network) => {
  const fullName = getCoinFullName(symbol.toLowerCase());

  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${fullName}&vs_currencies=usd`);

    console.log(response.data)

    if (response.data && response.data[fullName] && response.data[fullName].usd) {
      return response.data[fullName].usd;
    } else {
      throw new Error('Invalid response format from CoinGecko API.');
    }
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw new Error('Failed to fetch token price.');
  }
};

const getWeiValue = (amount, token) => {
  const conversionRates = {
    btc: '15877852995805999104', 
    eth: '1000000000000000000', 
    dash: '16053258402104000', 
    doge: '38636318585190',
    ltc: '38554269485648000', 
  };

  if (!conversionRates[token]) {
    throw new Error('Unsupported token.');
  }

  const amountBigNumber = new BigNumber(amount);
  const weiValue = amountBigNumber.times(tokenPrice).times(1e18).toFixed(0);

  return weiValue;
};

const cypherPay = async (req, res, next) => {
  const { price, price_fee, status, products, token } = req.body;
  const apiKey = process.env.CYPER_API;

  let destination_address;
  switch (token) {
    case 'btc':
      destination_address = 'bc1q56078sngmmtjtkytnavvju5msdd2v234w0txds';
      break;
    case 'dash':
      destination_address = 'XxLHc6MrjmBdEQsX3T9kv7dTfvKrmiDSsc';
      break;
    case 'doge':
      destination_address = 'DMxcT2Kis3CHvaZAi9xvcwmomeuc3i6vea';
      break;
    case 'ltc':
      destination_address = 'LYwAdC9CMCzivdPmDSUvFSP1bZ9GqYXqNi';
      break;
    case 'eth':
      destination_address = '0xf9Bd713f9A4f103f92D34B688977ac47128aC0d9';
      break;
    default:
      throw new Error('Invalid destination address.');
  }

  try {
    const mainnetTokens = ['btc', 'dash', 'doge', 'ltc', 'eth'];
    const isValidToken = mainnetTokens.includes(token);

    if (!isValidToken) {
      throw new Error('Invalid token selected.');
    }
    
    const tokenPrice = await fetchTokenPrice(token.toLowerCase(), 'main');
    const amountInToken = (price_fee / tokenPrice).toFixed(7);
    
    const weiValue = await getWeiValue(amountInToken, token)

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`,
    };

    const fullName = getCoinFullName(token.toLowerCase());
    const displayCurrency = token.toUpperCase()

    const response = await axios.post(`https://api.blockcypher.com/v1/${token}/main/payments?token=${apiKey}`, {
      amount: amountInToken,
      currency: displayCurrency,
      note: "Payment for products",
      destination: destination_address,
      callback_url: "http://localhost:5000/godtoolshost/api/app/cyperwebook",
      processing_fee: {
        percent: 5,
      },
    }, { headers });

    const address = response.data.input_address;

    const bitcoinURI = `${fullName}:${address}?amount=${amountInToken}`;

    const qrCodeData = await qr.toDataURL(bitcoinURI);    

    const createdOrder = new Order({
      author: req.userData.userId,
      price: price,
      status: false,
      products: products,
      address: address,
      crypto_info: {
        amount: amountInToken,
        token: token,
        wei: weiValue
      },
    });

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdOrder.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError('Error while creating order!', 500);
      return next(error);
    }

    res.json({
      address: address,
      price: amountInToken,
      token: token,
      qrCode: qrCodeData
    });
  } catch (err) {
    console.error('Error while creating order:', err);
    const error = new HttpError('Error while creating order!', 500);
    return next(error);
  }
};

const cypherWebhook = async (req, res, next) => {
  const { input_address, value } = req.body;
    
  try {
    const order = await Order.findOne({ address: input_address });

    if (order && parseInt(value) < parseInt(order.crypto_info.gwei)) {
      const httpError = new HttpError('The amount sent is not correct!', 500);
      return next(httpError);
    }    

    if (order && order.status === false) {
      order.status = true;
      order.request_status = 1;
      await order.save();

      const user = await User.findOne({ _id: order.author });
      const affcode = user.affcode;
    
      if(affcode) {
        const affiliate = await Affiliate.findOne({ code: affcode });
              
        const ordersCount = await Order.countDocuments({ author: order.author, status: true });
      
        if (ordersCount === 0) {
            const amount = Number(order.price);

            affiliate.orders.push(order);
            affiliate.balance += amount;
            await affiliate.save();
        }
      }
    
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    const httpError = new HttpError('Failed to process webhook.', 500);
    return next(httpError);
  }

  res.status(200).end();
};

// deposit
const createDeposit = async (req, res, next) => {
  const { price, pricenofee, status, token } = req.body;
  const apiKey = process.env.CYPER_API;

  let destination_address;
  switch (token) {
    case 'btc':
      destination_address = 'bc1q56078sngmmtjtkytnavvju5msdd2v234w0txds';
      break;
    case 'dash':
      destination_address = 'XxLHc6MrjmBdEQsX3T9kv7dTfvKrmiDSsc';
      break;
    case 'doge':
      destination_address = 'DMxcT2Kis3CHvaZAi9xvcwmomeuc3i6vea';
      break;
    case 'ltc':
      destination_address = 'LYwAdC9CMCzivdPmDSUvFSP1bZ9GqYXqNi';
      break;
    case 'eth':
      destination_address = '0xf9Bd713f9A4f103f92D34B688977ac47128aC0d9';
      break;
    default:
      throw new Error('Invalid destination address.');
  }

  try {
    const mainnetTokens = ['btc', 'dash', 'doge', 'ltc', 'eth'];
    const isValidToken = mainnetTokens.includes(token);
  
    if (!isValidToken) {
      throw new Error('Invalid token selected.');
    }
    
    const tokenPrice = await fetchTokenPrice(token.toLowerCase(), 'main');
    const amountInToken = (price / tokenPrice).toFixed(7);
    
    const weiValue = await getWeiValue(amountInToken, token)

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`,
    };

    const fullName = getCoinFullName(token.toLowerCase());
    const displayCurrency = token.toUpperCase()

    const response = await axios.post(`https://api.blockcypher.com/v1/${token}/main/payments?token=${apiKey}`, {
      amount: amountInToken,
      currency: displayCurrency,
      note: "Payment for credits",
      destination: destination_address,
      callback_url: "http://localhost:5000/godtoolshost/api/app/depositwebhook",
      processing_fee: {
        percent: 5,
      },
    }, { headers });

    const address = response.data.input_address;

    const bitcoinURI = `${fullName}:${address}?amount=${amountInToken}`;

    const qrCodeData = await qr.toDataURL(bitcoinURI);    

    const createdDeposit = new Deposit({
      author: req.userData.userId,
      price: price,
      pricenofee: pricenofee,
      status: false,
      address: address,
      crypto_info: {
        amount: amountInToken,
        token: token,
        wei: weiValue
      },
    });

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdDeposit.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError('Error while creating order!', 500);
      return next(error);
    }

    res.json({
      address: address,
      price: amountInToken,
      token: token,
      qrCode: qrCodeData
    });
  } catch (err) {
    console.error('Error while creating deposit:', err);
    const error = new HttpError('Error while creating deposit!', 500);
    return next(error);
  }
};

const depositWebhook = async (req, res, next) => {
  const { input_address, value } = req.body;

  try {
    const deposit = await Deposit.findOne({ address: input_address });

    if (deposit && parseInt(value) < parseInt(deposit.crypto_info.gwei)) {
      const httpError = new HttpError('The amount sent is not correct!', 500);
      return next(httpError);
    }    

    if (deposit && deposit.status === false) {
      deposit.status = true;
      deposit.deposit_date = Date.now();
      await deposit.save();

      const user = await User.findById(deposit.author);

      if (user) {
        user.balance += deposit.pricenofee;
        await user.save();
      } else {
        console.error('User not found for the deposit author:', deposit.author);
      }
    } else {
      console.error('Deposit not found or already processed:', input_address);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    const httpError = new HttpError('Failed to process webhook.', 500);
    return next(httpError);
  }

  res.status(200).end();
};

const getDepositList = async (req, res, next) => {
  let deposits;
  
  const { status } = req.body;

  try {
    deposits = await Deposit.find({ author: req.userData.userId, status: status })
      .sort({ createdAt: -1 }) 
      .limit(15); 
  } catch (error) {
    const httpError = new HttpError('Failed to fetch deposit list.', 500);
    return next(httpError);
  }

  res.status(200).json({ deposits: deposits })
}

const sendBalance = async (req, res, next) => {
  const { email, amount } = req.body;

  if (!email || !amount) {
    const httpError = new HttpError('All fields are required!', 500);
    return next(httpError);
  }

  const author = req.userData.userId;

  try {
    const authorUser = await User.findById(author);

    if (authorUser.email === email) {
      const httpError = new HttpError("You can't send balance to yourself.", 400);
      return next(httpError);
    }

    if (authorUser.balance < amount) {
      const httpError = new HttpError('Insufficient balance for the transfer.', 400);
      return next(httpError);
    }

    const recipientUser = await User.findOne({ email });

    if (!recipientUser) {
      const httpError = new HttpError('Recipient user not found.', 404);
      return next(httpError);
    }

    const parseamount = Number(amount);

    authorUser.balance -= parseamount;
    recipientUser.balance += parseamount;

    await authorUser.save();
    await recipientUser.save();

    res.status(200).json({ message: 'global_success' });
  } catch (error) {
    console.error('Error sending balance:', error);
    const httpError = new HttpError('Failed to send balance.', 500);
    return next(httpError);
  }
};

const balancePay = async (req, res, next) => {
  const { price } = req.body;
  const author = req.userData.userId;

  try {
    const authorUser = await User.findById(author);

    if (!authorUser) {
      const httpError = new HttpError('Author user not found.', 404);
      return next(httpError);
    }

    if (authorUser.balance < price) {
      const httpError = new HttpError('Insufficient balance to make the payment.', 400);
      return next(httpError);
    }

    const affcode = authorUser.affcode;
  
    if(affcode) {
      const affiliate = await Affiliate.findOne({ code: affcode });
            
      const ordersCount = await Order.countDocuments({ author: author, status: true });
    
      if (ordersCount === 0) {
          const amount = Number(price);

          affiliate.balance += amount;
          await affiliate.save();
      }
    }

    authorUser.balance -= price;
    await authorUser.save();

    res.status(200).json({ message: 'global_success' });
  } catch (error) {
    console.error('Error processing payment:', error);
    const httpError = new HttpError('Failed to process payment.', 500);
    return next(httpError);
  }
};

const getAffiliates = async (req, res, next) => {
  const uid = req.params.uid;

  let user;
  let affiliates;

  try {
    user = await User.findOne({ _id: uid });

    if (!user) {
      const httpError = new HttpError('User not found.', 500);
      return next(httpError);
    }

    affiliates = await Affiliate.find({ email: user.email });
  } catch (error) {
    const httpError = new HttpError('Error fetching affiliates.', 500);
    return next(httpError);
  }

  res.status(200).json({ affiliates: affiliates })
}

var pending_messages = [];

const sendChatWhisper = async (req, res, next) => {
  const { nick, message, key } = req.body;

  const obj = {
    key: key.current,
    nick: nick,
    message: message,
    pending: true
  }

  pending_messages.push(obj)
  ioInstance && ioInstance.to("admin").emit("newPending");

  res.status(200).json({ message: 'global_success' })
}

const clearChatWhisper = async (req, res, next) => {
  pending_messages = []

  console.log(pending_messages)

  res.status(200).json({ message: 'global_success' }) 
}

const getChatWhisper = async (req, res, next) => {
  res.status(200).json(pending_messages)
}

const callWhisper = async (req, res, next) => {
  const { message, sender, key } = req.body;

  if(!message || !sender || !key) {
    const httpError = new HttpError('Empty body.', 500);
    return next(httpError);
  }

  let license;
  try {
    license = await License.findOne({ key: key })
  } catch (err) {
    const httpError = new HttpError('Error fetching license.', 500);
    return next(httpError);
  }

  if(!license){
    const httpError = new HttpError('License dont exist.', 500);
    return next(httpError);
  }

  if (ioInstance) {
      ioInstance.to("admin").emit("updateMessages", { message: message, sender: sender, key: key, date: new Date() });
      ioInstance.to("license:" + key).emit("updateMessages", { message: message, sender: sender, key: key, date: new Date() });
  } else {
      console.error("ioInstance is not initialized.");
  }

  res.status(200).json({ message: message, sender: sender })
};

const getLicense = async (req, res, next) => {
  const id = req.params.id;

  let license;
  try {
    license = await License.findOne({ key: id })
  } catch (err) {
    const httpError = new HttpError('License dont exist.', 500);
    return next(httpError);
  }

  res.status(200).json({ license: license })
}

const getWow = async (req, res, next) => {
  let content;

  if (req.headers.hasOwnProperty('wowpw')) {
    const wowpwValue = req.headers['wowpw'];

    if (wowpwValue === '0123456789') {
      content = 'this is content'; 
    } else {
      content = null;
    }
  }

  res.status(200).json({ content: content })
};

const addLicenseToUser = async (req, res, next) => {
  const { license } = req.body;
  const author = req.userData.userId;

  try {
    const user = await User.findById(author);

    const lic = await License.findOne({ key: license.key })
    if(!lic) {
      const error = new HttpError('License not found', 404);
      return next(error);
    }

    if (!user) {
      const error = new HttpError('User not found', 404);
      return next(error);
    }

    const updateQuery = {
      _id: user._id,
      'licenses.key': { $ne: license.key },
    };

    const update = {
      $addToSet: { licenses: license }, 
    };

    const result = await User.updateOne(updateQuery, update);

    if (result.nModified === 0) {
      const httpError = new HttpError('License key already exists for this user', 400);
      return next(httpError);
    }

    res.status(200).json({ message: 'global_success' });
  } catch (error) {
    console.error('Error adding license to user:', error);
    const httpError = new HttpError('Could not add license to user', 500);
    return next(httpError);
  }
};

const deleteLicenseToUser = async (req, res, next) => {
  const key = req.params.key;
  const author = req.userData.userId;

  try {
    const user = await User.findById(author);
    const lic = await License.findOne({ key: key })

    if(!lic) {
      const error = new HttpError('License not found', 404);
      return next(error);
    }

    if (!user) {
      const error = new HttpError('User not found', 404);
      return next(error);
    }

    const updateQuery = {
      _id: user._id,
      'licenses.key': key, 
    };

    const update = {
      $pull: { licenses: { key: key } }, 
    };

    const result = await User.updateOne(updateQuery, update);

    if (result.nModified === 0) {
      const httpError = new HttpError('License key not found for this user', 400);
      return next(httpError);
    }

    res.status(200).json({ message: 'global_success' });
  } catch (error) {
    console.error('Error deleting license for user:', error);
    const httpError = new HttpError('Could not delete license for user', 500);
    return next(httpError);
  }
};



exports.getServices = getServices;
exports.getArticles = getArticles;
exports.getServiceById = getServiceById;
exports.searchForm = searchForm;
exports.getProductById = getProductById;
exports.createOrder = createOrder;
exports.getUserOrders = getUserOrders;
exports.requestCodes = requestCodes;
exports.cypherPay = cypherPay;
exports.cypherWebhook = cypherWebhook;
exports.createDeposit = createDeposit;
exports.depositWebhook = depositWebhook;
exports.fetchTokenPrice = fetchTokenPrice;
exports.fetchTokens = fetchTokens;
exports.getDepositList = getDepositList;
exports.sendBalance = sendBalance;
exports.balancePay = balancePay;
exports.getAffiliates = getAffiliates;
exports.callWhisper = callWhisper;
exports.sendChatWhisper = sendChatWhisper;
exports.clearChatWhisper = clearChatWhisper;
exports.getChatWhisper = getChatWhisper;
exports.getLicense = getLicense;
exports.getWow = getWow;
exports.addLicenseToUser = addLicenseToUser;
exports.deleteLicenseToUser = deleteLicenseToUser;
exports.initialize = initialize;