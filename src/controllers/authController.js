const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken } = require('../utils/token');
const { registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema } = require('../utils/validation');
const { sendOTPVerificationEmail } = require('../utils/emailSetup');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate request
        const validationResult = registerSchema.safeParse({ username, email, password });
        if (!validationResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: validationResult.error.errors });
        }

        // Check if user exists by email
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Check if username is taken
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
        }

        // Check if OTP was verified
        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord || !otpRecord.verified) {
            return res.status(400).json({ message: 'Email not verified. Please complete OTP verification first.' });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            // Cleanup OTP record
            await OTP.deleteOne({ email });

            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate request
        const validationResult = sendOtpSchema.safeParse({ email });
        if (!validationResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: validationResult.error.errors });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Generate 6 digit OTP
        const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

        // Save/Update in DB
        await OTP.findOneAndUpdate(
            { email },
            { otp: otpValue, verified: false, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send email
        await sendOTPVerificationEmail(email, otpValue);

        res.json({ message: 'OTP sent to email successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error sending OTP', error: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate request
        const validationResult = verifyOtpSchema.safeParse({ email, otp });
        if (!validationResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: validationResult.error.errors });
        }

        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return res.status(404).json({ message: 'OTP not found. It may have expired. Please request a new one.' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP code' });
        }

        // Valid! Mark as verified
        otpRecord.verified = true;
        await otpRecord.save();

        res.json({ message: 'Email verified successfully! You can now complete registration.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error verifying OTP', error: error.message });
    }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate request
        const validationResult = loginSchema.safeParse({ email, password });
        if (!validationResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: validationResult.error.errors });
        }

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get user profile (Protected route example)
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    sendOTP,
    verifyOTP
};
