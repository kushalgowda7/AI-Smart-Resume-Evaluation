const User = require('../models/User');
const TempUser = require('../models/TempUser');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail } = require('../utils/otp');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if a verified user exists with this email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: `An account with this email already exists.`
            });
        }

        // Use a temporary collection
        // Remove any previous temporary user with the same email
        await TempUser.deleteOne({ email });

        // Generate OTP
        const otp = generateOTP();

        // Create temporary user with OTP
        const tempUser = new TempUser({ ...req.body, role: 'jobseeker', otp });
        await tempUser.save();

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);
        if (!emailSent) {
            return res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
        }

        res.status(201).json({
            success: true,
            message: `OTP sent to ${email}. Please verify to complete registration.`,
        });

    } catch (error) {
        // Handle potential duplicate key error for email in TempUser schema
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'An account with this email is already pending verification.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Verify against the TempUser collection
        const tempUser = await TempUser.findOne({ email, otp });

        if (!tempUser) {
            return res.status(400).json({ success: false, message: 'Invalid OTP or OTP has expired.' });
        }

        // Create permanent user from temporary data
        const newUser = await User.create({
            fullName: tempUser.fullName,
            email: tempUser.email,
            password: tempUser.password, // Password is already hashed in TempUser model
            role: 'jobseeker',
        });

        // Delete the temporary user
        await TempUser.deleteOne({ _id: tempUser._id });

        // Create token
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(200).json({
            success: true,
            message: 'Account verified successfully.',
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};