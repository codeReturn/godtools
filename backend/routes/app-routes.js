const express = require('express');
const { check } = require('express-validator');

const appController = require('../controllers/app-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/getservices', appController.getServices);
router.get('/getarticles', appController.getArticles);
router.get('/getservicebyid/:sid', appController.getServiceById);
router.get('/search/:search', appController.searchForm)
router.get('/getproductbyid/:pid', appController.getProductById);
router.get('/getaffiliates/:uid', appController.getAffiliates);

router.get('/fetchtokens', appController.fetchTokens);
router.post('/cyperwebook', appController.cypherWebhook);
router.post('/depositwebhook', appController.depositWebhook);

router.post('/whisper', appController.callWhisper)
router.post('/sendchatwhisper', checkAuth, appController.sendChatWhisper);
router.post('/clearchatwhisper', appController.clearChatWhisper);
router.get('/getchatwhisper', appController.getChatWhisper);
router.get('/getlicense/:id', appController.getLicense);

router.post('/getdepositlist', checkAuth, appController.getDepositList)
router.post('/sendbalance', checkAuth, appController.sendBalance)
router.get('/getwow', appController.getWow)

router.post('/cyperpay', checkAuth, appController.cypherPay)
router.post('/balancepay', checkAuth, appController.balancePay)
router.post('/createdeposit', checkAuth, appController.createDeposit)
router.post('/createorder', checkAuth, appController.createOrder)
router.get('/getuserorders', checkAuth, appController.getUserOrders)
router.patch('/requestcodes', checkAuth, appController.requestCodes)
router.post('/addlicensetouser', checkAuth, appController.addLicenseToUser)
router.delete('/deletelicensetouser/:key', checkAuth, appController.deleteLicenseToUser)

module.exports = router;
