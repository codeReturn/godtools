const fs = require('fs');
const { validationResult } = require('express-validator');

const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Service = require('../models/service');
const Product = require('../models/product');
const Order = require('../models/order');
const Article = require('../models/article');
const Affiliate = require('../models/affiliate');
const License = require('../models/license');

var crypto = require("crypto");

const paginate = require('jw-paginate');

let ioInstance;

function initialize(io) {
    ioInstance = io;
}

const createService = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const { name, description } = req.body;

  const createdService = new Service({
    name,
    description,
    image: req.file.path
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  if(user.rank !== 1){
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdService.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Error while creating a service!',
      500
    );
    return next(error);
  }

  res.status(201).json({ service: createdService });
}

const createArticle = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const { title, description } = req.body;

  const createdArticle = new Article({
    title,
    description,
    image: req.file.path
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  if(user.rank !== 1){
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdArticle.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Error while creating a article!',
      500
    );
    return next(error);
  }

  res.status(201).json({ article: createdArticle });
}

const getUsers = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  if(user.rank !== 1){
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

  let users;

  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'We got error while fetching users!',
      500
    );
    return next(error);   
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;
  const pager = paginate(users.length, page, pageSize);
  const pageOfItems = users.map(user => user.toObject({ getters: true })).slice(pager.startIndex, pager.endIndex + 1);

  return res.json({ pager, pageOfItems });
}

const getArticles = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  if(user.rank !== 1){
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

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

const getServices = async (req, res, next) => {
    let user;
    try {
      user = await User.findById(req.userData.userId);
    } catch (err) {
      const error = new HttpError(
        'Cant find user!',
        500
      );
      return next(error);
    }
  
    if(user.rank !== 1){
      const error = new HttpError('You dont have access', 500);
      return next(error);  
    }
  
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

const getOrders = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  if (user.rank !== 1 && user.rank !== 2) {
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

  let orders;

  const requested = req.query.requested;
  try {
    if(requested === "true") {
      orders = await Order.find({ request_status: 2 }).sort({ date: -1 });
    } else {
      orders = await Order.find({}).sort({ date: -1 });
    }
  } catch (err) {
    const error = new HttpError(
      'We got error while fetching orders!',
      500
    );
    return next(error);   
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;
  const pager = paginate(orders.length, page, pageSize);
  const pageOfItems = orders.map(order => order.toObject({ getters: true })).slice(pager.startIndex, pager.endIndex + 1);

  return res.json({ pager, pageOfItems });
}

const getAffiliates = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  if (user.rank !== 1) {
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

  let affiliates;

  try {
    affiliates = await Affiliate.find({}).sort({ _id: -1 });
  } catch (err) {
    const error = new HttpError(
      'We got error while fetching affiliates!',
      500
    );
    return next(error);   
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;
  const pager = paginate(affiliates.length, page, pageSize);
  const pageOfItems = affiliates.map(affiliate => affiliate.toObject({ getters: true })).slice(pager.startIndex, pager.endIndex + 1);

  return res.json({ pager, pageOfItems });
}

const getLicenses = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  if (user.rank !== 1) {
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

  let licenses;

  try {
    licenses = await License.find({}).sort({ _id: -1 });
  } catch (err) {
    const error = new HttpError(
      'We got error while fetching licenses!',
      500
    );
    return next(error);   
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;
  const pager = paginate(licenses.length, page, pageSize);
  const pageOfItems = licenses.map(licence => licence.toObject({ getters: true })).slice(pager.startIndex, pager.endIndex + 1);

  return res.json({ pager, pageOfItems });
}

const createProduct = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new HttpError('We got some errors!', 422)
      );
    }
  
    const { name, description, service, service_info , price } = req.body;

  
    let user;
    try {
      user = await User.findById(req.userData.userId);
    } catch (err) {
      const error = new HttpError(
        'Cant find user!',
        500
      );
      return next(error);
    }
  
    if(user.rank !== 1){
      const error = new HttpError('You dont have access', 500);
      return next(error);  
    }

    let dbservice;
    try {
        dbservice = await Service.findById(service);
    } catch (err) {
      const error = new HttpError(
        'Cant find service!',
        500
      );
      return next(error);
    }

    const createdProduct = new Product({
      name,
      description,
      image: req.file.path,
      service,
      service_info: dbservice.name,
      price
    });

    console.log(createdProduct)
  
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdProduct.save({ session: sess });

      dbservice.products.push(createdProduct);
      await dbservice.save({ session: sess });

      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError(
        'Error while creating a product!',
        500
      );
      return next(error);
    }
  
    res.status(201).json({ product: createdProduct });
  }
  
  const getProducts = async (req, res, next) => {
      let user;
      try {
        user = await User.findById(req.userData.userId);
      } catch (err) {
        const error = new HttpError(
          'Cant find user!',
          500
        );
        return next(error);
      }
    
      if(user.rank !== 1){
        const error = new HttpError('You dont have access', 500);
        return next(error);  
      }
    
      let products;
    
      try {
        products = await Product.find({});
      } catch (err) {
        const error = new HttpError(
          'We got error while fetching products!',
          500
        );
        return next(error);   
      }
    
      res.status(201).json({ products: products })
}

const getServiceById = async (req, res, next) => {
    const id = req.params.id;

    let service;
  
    try {
        service = await Service.find({ _id: id });
    } catch (err) {
      const error = new HttpError(
        'We got some error!',
        500
      );
      return next(error);
    }
  
    res.status(200).json({ service: service });
}

const deleteProduct = async (req, res, next) => {
  const pId = req.params.pid;

  let product;
  try {
    product = await Product.findById(pId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching product!',
      500
    );
    return next(error);
  }

  if (!product) {
    const error = new HttpError('Product dont exist!', 404);
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  let service;
  try {
    service = await Service.findById(product.service);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching service!',
      500
    );
    return next(error);   
  }

  const imagePath = product.image;

  const { ObjectId } = require('mongodb');
  const serviceId = ObjectId(product.service); 

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await Service.findOneAndUpdate(
          { _id: serviceId }, 
          { $pull: { products: { _id: product._id }  }}
    );

    await product.remove({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Error while deleting product!",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: 'global_success' });
}

const deleteArticle = async (req, res, next) => {
  const aId = req.params.aid;

  let article;
  try {
    article = await Article.findById(aId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching article!',
      500
    );
    return next(error);
  }

  if (!article) {
    const error = new HttpError('Article dont exist!', 404);
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }


  const imagePath = article.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await article.remove({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Error while deleting article!",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: 'global_success' });
}

const deleteAffiliate = async (req, res, next) => {
  const aId = req.params.aid;

  let affiliate;
  try {
    affiliate = await Affiliate.findById(aId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching affiliate!',
      500
    );
    return next(error);
  }

  if (!affiliate) {
    const error = new HttpError('Affiliate dont exist!', 404);
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await affiliate.remove({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Error while deleting affiliate!",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'global_success' });
}

const deleteLicense = async (req, res, next) => {
  const lId = req.params.lid;

  let license;
  try {
    license = await License.findById(lId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching license!',
      500
    );
    return next(error);
  }

  if (!license) {
    const error = new HttpError('License dont exist!', 404);
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await license.remove({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Error while deleting license!",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'global_success' });

}

const deleteUser = async (req, res, next) => {
  const uid = req.params.uid;

  let user;
  try {
    user = await User.findById(uid);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('This user dont exist!', 404);
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await user.remove({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      'We got some error!',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'global_success' });
};


const deleteService = async (req, res, next) => {
  const sid = req.params.sid;

  let service;
  try {
    service = await Service.findById(sid);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching service!',
      500
    );
    return next(error);
  }

  if (!service) {
    const error = new HttpError('This service dont exist!', 404);
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  const { ObjectId } = require('mongodb');
  const _id = ObjectId(sid); 

  let products;
  try {
    products = await Product.find({ service: _id })
  } catch (err) {
    const error = new HttpError(
      'Error while fetching products for delete!',
      500
    );
    return next(error);
  }

  products.forEach(product => {
     fs.unlink(product.image, err => {
      console.log(err);
     });  
  })

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await service.remove({ session: sess });
    await Product.deleteMany({ service: _id });

    await sess.commitTransaction();
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      'We got some error!',
      500
    );
    return next(error);
  }

  fs.unlink(service.image, err => {
    console.log(err);
  })  

  res.status(200).json({ message: 'global_success' });
};

const updateService = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const sId = req.params.sid;

  let serv;
  try {
    serv = await Service.findById(sId);
  } catch (err) {
    const error = new HttpError(
      'We cant find this service!',
      500
    );
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  const { name, description } = req.body;

  serv.name = name;
  serv.description = description;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await serv.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'We got some error while saving changes!',
      500
    );
    return next(error);
  }

  res.status(200).json({ serv: serv });
}

const updateArticle = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const aId = req.params.aid;

  let art;
  try {
    art = await Article.findById(aId);
  } catch (err) {
    const error = new HttpError(
      'We cant find this article!',
      500
    );
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  const { title, description, active } = req.body;

  art.title = title;
  art.description = description;
  art.active = active;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await art.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'We got some error while saving changes!',
      500
    );
    return next(error);
  }

  res.status(200).json({ art: art });
}

const updateAffiliate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const aId = req.params.aid;

  let affiliate;
  try {
    affiliate = await Affiliate.findById(aId);
  } catch (err) {
    const error = new HttpError(
      'We cant find this affiliate!',
      500
    );
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  const { title, description, email } = req.body;

  let emailuser;
  try {
    emailuser = await User.findOne({ email: email })
  } catch (err) {
    const error = new HttpError(
      'Cant find email of user!',
      500
    );
    return next(error);
  }

  if(!emailuser || !email) {
    const error = new HttpError(
      'Cant find email of user or email is empty!',
      500
    );
    return next(error);
  }

  affiliate.title = title;
  affiliate.description = description;
  affiliate.email = email;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await affiliate.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'We got some error while saving changes!',
      500
    );
    return next(error);
  }

  res.status(200).json({ affiliate: affiliate });
}

const updateLicense = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const lId = req.params.lid;

  let license;
  try {
    license = await License.findById(lId);
  } catch (err) {
    const error = new HttpError(
      'We cant find this license!',
      500
    );
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  const { title, key } = req.body;

  license.title = title;
  license.key = key;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await license.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'We got some error while saving changes!',
      500
    );
    return next(error);
  }

  res.status(200).json({ license: license });
}

const updateProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const pId = req.params.pid;

  let prod;
  try {
    prod = await Product.findById(pId);
  } catch (err) {
    const error = new HttpError(
      'We cant find this product!',
      500
    );
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  const { name, description, price, service, active, borders } = req.body;

  let dbservice;
  try {
      dbservice = await Service.findById(service);
  } catch (err) {
    const error = new HttpError(
      'Cant find service!',
      500
    );
    return next(error);
  }

  prod.name = name;
  prod.description = description;
  prod.service = service;
  prod.service_info = dbservice.name;
  prod.price = price;
  prod.active = active;
  prod.borders = borders;
  
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await prod.save();

    await Service.findOneAndUpdate(
      { _id: service },
      {
        $set: {
          'products.$[product]': prod,
        },
      },
      {
        arrayFilters: [{ 'product._id': mongoose.Types.ObjectId(pId) }],
        session: sess,
      }
    );

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'We got some error while saving changes!',
      500
    );
    return next(error);
  }

  res.status(200).json({ prod: prod });
}

const getStats = async (req, res, next) => {
  let users;
  let services;
  let products;
  let orders;
  let articles;
  let affiliates;
  let licenses;

  try {
    users = await User.find({})
    services = await Service.find({})
    products = await Product.find({})
    orders = await Order.find({})
    articles = await Article.find({})
    affiliates = await Affiliate.find({})
    licenses = await License.find({})
  } catch (err) {
    const error = new HttpError(
      'Error while getting stats!',
      500
    );
    return next(error);    
  }

  res.status(201).json({
    users_count: users.length,
    services_count: services.length,
    products_count: products.length,
    orders_count: orders.length,
    articles_count: articles.length,
    affiliates_count: affiliates.length,
    licenses_count: licenses.length
  })
}

const updateRank = async (req, res, next) => {
  const uId = req.params.uid;

  let user;
  try {
    user = await User.findById(uId);
  } catch (err) {
    const error = new HttpError(
      'We cant find this user!',
      500
    );
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  const { type } = req.body;

  let rank;
  if(type === 1) {
    rank = 0;
  } else if(type === 2) {
    rank = 1;
  } else if(type === 3) {
    rank = 2;
  }

  user.rank = rank;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await user.save();
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

const sendCodes = async (req, res, next) => {
  const { id, message } = req.body;

  let order;
  try {
    order = await Order.findById(id);
  } catch (err) {
    const error = new HttpError(
      'We cant find this order!',
      500
    );
    return next(error);
  }

  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  if (admin.rank !== 1) {
    const error = new HttpError('You dont have access!', 404);
    return next(error);
  }

  let user;
  try {
    user = await User.findById(order.author)
  } catch (err) {
    const error = new HttpError(
      'Error while fetching user!',
      500
    );
    return next(error);
  }

  order.request_status = 2;
  order.request_message = message;

  if (ioInstance) {
    ioInstance.to("user:" + order.author).emit('newnotification')
  } else {
    console.error("ioInstance is not initialized.");
  }

  const nodemailer = require("nodemailer");

  let transporter = nodemailer.createTransport({
    host: "mail.san-company.com",
    port: 465,
    secure: true, 
    auth: {
      user: "testing@san-company.com",
      pass: "Z-(.%Ea^V?w}", 
    },
  });

  let mailOptions = {
    from: 'testing@san-company.com', 
    to: user.email,
    subject: 'Order License',
    html: message
  };

  transporter.sendMail(mailOptions, function(err, info){
    if (err) {
      const error = new HttpError(
        'Error while sending email!',
        500
      );
      return next(error);
    } 

    console.log('Email sent: ' + info.response);
  });

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

const createAffiliate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors)
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const { title, description, email } = req.body;

  const generatedCode = crypto.randomBytes(8).toString('hex').slice(0, 10);

  const createdAffiliate = new Affiliate({
    title,
    description,
    code: generatedCode,
    email: email
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  let emailuser;
  try {
    emailuser = await User.findOne({ email: email })
  } catch (err) {
    const error = new HttpError(
      'Cant find email of user!',
      500
    );
    return next(error);
  }

  if(!emailuser) {
    const error = new HttpError(
      'Cant find email of user!',
      500
    );
    return next(error);
  }

  if(user.rank !== 1){
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdAffiliate.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Error while creating a affiliate!',
      500
    );
    return next(error);
  }

  res.status(201).json({ affiliate: createdAffiliate });
}

const createLicense = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors)
    return next(
      new HttpError('We got some errors!', 422)
    );
  }

  const { title, key } = req.body;

  const createdLicense = new License({
    title,
    key
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Cant find user!',
      500
    );
    return next(error);
  }

  if(user.rank !== 1){
    const error = new HttpError('You dont have access', 500);
    return next(error);  
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdLicense.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Error while creating a license!',
      500
    );
    return next(error);
  }

  res.status(201).json({ license: createdLicense });
}

exports.createService = createService;
exports.createArticle = createArticle;
exports.getUsers = getUsers;
exports.getArticles = getArticles;
exports.getServices = getServices;
exports.getOrders = getOrders;
exports.getAffiliates = getAffiliates;
exports.getLicenses = getLicenses;
exports.createProduct = createProduct;
exports.getProducts = getProducts;
exports.getServiceById = getServiceById;
exports.deleteProduct = deleteProduct;
exports.deleteUser = deleteUser;
exports.deleteService = deleteService;
exports.deleteArticle = deleteArticle;
exports.deleteAffiliate = deleteAffiliate;
exports.deleteLicense = deleteLicense;
exports.updateService = updateService;
exports.updateArticle = updateArticle;
exports.updateAffiliate = updateAffiliate;
exports.updateLicense = updateLicense;
exports.updateProduct = updateProduct;
exports.updateRank = updateRank;
exports.getStats = getStats;
exports.sendCodes = sendCodes;
exports.createAffiliate = createAffiliate;
exports.createLicense = createLicense;
exports.initialize = initialize;