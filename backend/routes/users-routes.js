const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.post(
    '/signup',
    [
      check('name')
        .not()
        .isEmpty(),
      check('email')
        .normalizeEmail()
        .isEmail(),
      check('password').isLength({ min: 6 })
    ],
    usersController.signup
);
  
router.post('/login', usersController.login);

router.get('/user/:uid', usersController.getuserbyid);

router.post(
  '/resetpassword',
  [
    check('email')
      .normalizeEmail()
      .isEmail()
  ],
  usersController.resetpassword
);

router.post(
  '/resetpasswordupdate',
  [
    check('newpassword').isLength({ min: 6 }),
    check('repeatpassword').isLength({ min: 6 })
  ],
  usersController.resetpasswordupdate
);

router.get('/getlink/:link', usersController.getlink);

router.use(checkAuth);

router.patch(
  '/user/password/:uid',
  [
    check('oldpassword').isLength({ min: 6 }),
    check('newpassword').isLength({ min: 6 })
  ],
  usersController.updatePassword
);

router.patch(
  '/user/socials/:uid', usersController.updateSocials
);

module.exports = router;
