const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    // name: String,
    email: String,
    password: {
        type: String,
        minLength: [8, "Password must have at least 8 characters"],
        maxLength: [32, "Password must have at most 32 characters"],
        select: false,
    },
    // phone: {
    //     type: String,
    // },
    role: {
  type: String,
  enum: ["seeker", "provider", "admin"]
//   default: "seeker"
},

    accountVerified: { type: Boolean, default: false },
    verificationCode: Number,
    verificationCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
         return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
     next();
});

userSchema.methods.comparePassword = async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);
};

userSchema.methods.generateVerificationCode = function () {
    function generateRandomFiveDigitNumber() {
        const firstDigit = Math.floor(Math.random() * 9) + 1;
        const remainingDigits = Math.floor(Math.random() * 10000).toString().padStart(4, 0);
        return parseInt(firstDigit + remainingDigits);
    }

    const verificationCode = generateRandomFiveDigitNumber();
    this.verificationCode = verificationCode;
    this.verificationCodeExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    return verificationCode;
};

userSchema.methods.generateToken = async function () {
    return jwt.sign(
        { _id: this._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "10d" }
    );
};

userSchema.methods.generateResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 50 * 60 * 1000; // 50 minutes

    return resetToken;
};

const ProviderAuth = mongoose.model("ProviderAuth", userSchema);
module.exports = { ProviderAuth };
