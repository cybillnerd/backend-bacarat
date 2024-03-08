// routes.js
const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referalControler/index');

// Define routes
router.post('/add', referralController.addReferralInformation);
router.get('/details/:referral_Address', referralController.getDetails);
router.get('/list/', referralController.referralList);

module.exports = router;
