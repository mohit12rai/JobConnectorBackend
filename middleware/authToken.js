const { wrapAsyn } = require("../utils/wrapeAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const jwt = require("jsonwebtoken");
const { User } = require("../models/AdminAuth.js");

exports.isAuthenticated = wrapAsyn(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ExpressError("User not authorized: No token found", 401));
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decode._id);

    next();
});
