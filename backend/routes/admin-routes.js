const express = require('express');
const { check } = require('express-validator');

const adminControllers = require('../controllers/admin-controllers');
const checkAdminAuth = require('../middleware/check-adminauth');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.use(checkAdminAuth);

router.get('/getstats', adminControllers.getStats);
router.get('/getusers', adminControllers.getUsers);
router.get('/getservices', adminControllers.getServices);
router.get('/getorders', adminControllers.getOrders);
router.get('/getaffiliates', adminControllers.getAffiliates);
router.get('/getlicenses', adminControllers.getLicenses);

router.post(
    '/createservice',
    fileUpload.single('image'),
    [
      check('name')
        .not()
        .isEmpty(),
      check('description')
        .not()
        .isEmpty()
    ],
    adminControllers.createService
);

router.get('/getservice/:id', adminControllers.getServiceById)


router.get('/getarticles', adminControllers.getArticles);

router.post(
  '/createarticle',
  fileUpload.single('image'),
  [
    check('title')
      .not()
      .isEmpty(),
    check('description')
      .not()
      .isEmpty()
  ],
  adminControllers.createArticle
);

router.get('/getproducts', adminControllers.getProducts);

router.post(
    '/createproduct',
    fileUpload.single('image'),
    [
      check('name')
        .not()
        .isEmpty(),
      check('description')
        .not()
        .isEmpty(),
      check('service')
          .not()
          .isEmpty(),
      check('price')
            .not()
            .isEmpty()
    ],
    adminControllers.createProduct
);

router.post(
  '/createaffiliate',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description')
      .not()
      .isEmpty(),
    check('email')
      .not()
      .isEmpty()
  ],
  adminControllers.createAffiliate
);

router.post(
  '/createlicense',
  [
    check('title')
      .not()
      .isEmpty(),
    check('key')
      .not()
      .isEmpty()
  ],
  adminControllers.createLicense
);

router.delete('/deleteuser/:uid', adminControllers.deleteUser);
router.delete('/deleteproduct/:pid', adminControllers.deleteProduct);
router.delete('/deleteservice/:sid', adminControllers.deleteService);
router.delete('/deletearticle/:aid', adminControllers.deleteArticle);
router.delete('/deleteaffiliate/:aid', adminControllers.deleteAffiliate);
router.delete('/deletelicense/:lid', adminControllers.deleteLicense);

router.patch(
  '/rank/:uid',
  adminControllers.updateRank
);

router.patch('/sendcodes', adminControllers.sendCodes)

router.patch(
  '/services/:sid',
  [
    check('name')
      .not()
      .isEmpty(),
    check('description')
      .not()
      .isEmpty()
  ],
  adminControllers.updateService
);

router.patch(
  '/products/:pid',
  [
    check('name')
      .not()
      .isEmpty(),
    check('description')
      .not()
      .isEmpty(),
    check('price')
        .not()
        .isEmpty(),
    check('service')
            .not()
            .isEmpty()
  ],
  adminControllers.updateProduct
);

router.patch(
  '/articles/:aid',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description')
      .not()
      .isEmpty()
  ],
  adminControllers.updateArticle
);

router.patch(
  '/affiliate/:aid',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description')
      .not()
      .isEmpty(),
    check('email')
      .not()
      .isEmpty()
  ],
  adminControllers.updateAffiliate
);

router.patch(
  '/license/:lid',
  [
    check('title')
      .not()
      .isEmpty(),
    check('key')
      .not()
      .isEmpty(),
  ],
  adminControllers.updateLicense
);

module.exports = router;
