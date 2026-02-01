const express = require('express');
const {
    register,
    login,
    verifyOtp,
} = require('../controllers/authController');
const { validate, registerRules, loginRules, otpRules } = require('../middleware/validators');

const router = express.Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/verify-otp', otpRules, validate, verifyOtp);

module.exports = router;
