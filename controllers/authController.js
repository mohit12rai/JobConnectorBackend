const { wrapAsyn } = require("../utils/wrapeAsync");
const { AdminAuth } = require("../models/AdminAuth.js");
const { SeekerAuth } = require("../models/SeekerAuth.js");
const { ProviderAuth } = require("../models/ProviderAuth.js");
const {ExpressError} = require("../utils/ExpressError.js");
const { sendEmail } = require("../utils/sendEmail.js");
const twilio = require("twilio");
const { sendToken } = require("../utils/SendToken.js");
const crypto = require("crypto");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);



exports.register = wrapAsyn(async (req, res, next) => {
    try {
        const { email, password, confirmPassword, role } = req.body;

        // Validate required fields
        if (!email || !password || !confirmPassword || !role) {
            return next(new ExpressError("All fields are required", 400));
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return next(new ExpressError("Passwords do not match", 400));
        }

        let existingUser;
        let userModel;

        // Role-based logic
        if (role === 'seeker') {
            existingUser = await SeekerAuth.findOne({ email });
            userModel = SeekerAuth;
        } else if (role === 'provider') {
            existingUser = await ProviderAuth.findOne({ email });
            userModel = ProviderAuth;
        } else if (role === 'admin') {
            existingUser = await AdminAuth.findOne({ email });
            userModel = AdminAuth;
        } else {
            return next(new ExpressError("Invalid role specified", 400));
        }

        if (existingUser) {
            return next(new ExpressError("Email is already registered", 400));
        }

        // Create and return user
        const newUser = await userModel.create({ email, password });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: newUser,
        });
    } catch (error) {
        next(error);
    }
  })

async function sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res) {
    try {
        if (verificationMethod === 'email') {
            const message = generateEmailTemplate(verificationCode);
            sendEmail({ email, subject: "your verification code", message });

            res.status(201).json({
                success: true,
                message: `verification code sent to ${name}`
            });

        } else if (verificationMethod === "phone") {
            const verificationCodewithSpace = verificationCode.toString().split("").join(" ");

            const call = await client.calls.create({
                twiml: `<Response><Say>Your Verification Code is ${verificationCodewithSpace}. Your Verification Code is ${verificationCodewithSpace}</Say></Response>`,
                from: process.env.TWILIO_PHONE,
                to: phone,
            });

            console.log("Twilio Call Payload:", {
                twiml: `<Response><Say>Your Verification Code is ${verificationCodewithSpace}</Say></Response>`,
                from: process.env.TWILIO_PHONE,
                to: phone,
            });

            res.status(201).json({
                success: true,
                message: `OTP SENT`
            });

        } else {
            return res.status(500).json({
                success: false,
                message: "invalid verification method"
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "failed to send verification code"
        });
    }
}

function generateEmailTemplate(verificationCode) {
    return `
       <div style="...">Your Verification Code: ${verificationCode}</div>
    `;
}

exports.verifyOTP = wrapAsyn(async (req, res, next) => {
    const { email, otp, phone } = req.body;

    function validPhoneNumber(phone) {
        const phoneRegex = /^\+91\d{10}$/;
        return phoneRegex.test(phone);
    }

    if (!validPhoneNumber(phone)) {
        return next(new ExpressError("Invalid phone number", 400));
    }

    try {
        const userAllEntries = await User.find({
            $or: [
                { email, accountVerified: false },
                { phone, accountVerified: false }
            ]
        }).sort({ createdAt: -1 });

        if (userAllEntries.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        let user = userAllEntries[0];

        if (userAllEntries.length > 1) {
            await User.deleteMany({
                _id: { $ne: user._id },
                $or: [
                    { phone, accountVerified: false },
                    { email, accountVerified: false }
                ]
            });
        }

        if (user.verificationCode !== Number(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        const currentTime = Date.now();
        const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();
        if (currentTime > verificationCodeExpire) {
            return next(new ExpressError("OTP expired", 400));
        }

        user.accountVerified = true;
        user.verificationCodeExpire = null;
        user.verificationCode = null;

        await user.save({ validateModifiedOnly: true });

        sendToken(user, 200, "Account Verified", res);

    } catch (error) {
        return next(new ExpressError("Internal server error", 500));
    }
});






exports.login = wrapAsyn(async (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return next(new ExpressError("Please provide email, password, and role.", 400));
    }

    let userModel;

    // Select the correct model based on role
    if (role === 'seeker') {
        userModel = SeekerAuth;
    } else if (role === 'provider') {
        userModel = ProviderAuth;
    } else if (role === 'admin') {
        userModel = AdminAuth;
    } else {
        return next(new ExpressError("Invalid role specified.", 400));
    }

    // Find user with password
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
        return next(new ExpressError("Invalid email or password.", 400));
    }

    // Compare password
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ExpressError("Invalid email or password.", 400));
    }

    // Send token with user info
    sendToken(user, 200, "User logged in successfully.", res);
});



exports.logout = wrapAsyn(async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
});

exports.getUser = wrapAsyn(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});



exports.forgetPassword = wrapAsyn(async (req, res, next) => {
    const { email, role } = req.body;

    if (!email || !role) {
        return next(new ExpressError("Email and role are required", 400));
    }

    let userModel;

    if (role === 'seeker') {
        userModel = SeekerAuth;
    } else if (role === 'provider') {
        userModel = ProviderAuth;
    } else if (role === 'admin') {
        userModel = AdminAuth;
    } else {
        return next(new ExpressError("Invalid role specified", 400));
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        return next(new ExpressError("User not found", 404));
    }

    // Generate reset token and save user
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    const message = `<div>Click to reset: <a href="${resetPasswordUrl}">${resetPasswordUrl}</a></div>`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            message
        });

        res.status(200).json({
            success: true,
            message: `Password reset email sent to ${user.email}`
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ExpressError("Failed to send password reset email", 500));
    }
});


exports.resetPassword = wrapAsyn(async (req, res, next) => {
    const { token } = req.params;
    const { password, role } = req.body;

    if (!password || !role) {
        return next(new ExpressError("Password and role are required", 400));
    }

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    let userModel;

    if (role === 'seeker') {
        userModel = SeekerAuth;
    } else if (role === 'provider') {
        userModel = ProviderAuth;
    } else if (role === 'admin') {
        userModel = AdminAuth;
    } else {
        return next(new ExpressError("Invalid role specified", 400));
    }

    const user = await userModel.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ExpressError("Invalid or expired reset token", 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, "Password reset successful", res);
});
