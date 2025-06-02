const sendToken = async (user, statusCode, message, res) => {
    const token = await user.generateToken();
    
    res
      .status(statusCode)
      .cookie("token", token, {
        expires: new Date(
          Date.now() + process.env.COOKEI_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
      })
      .json({
        success: true,
        user,
        message,
        token,
      });
};

module.exports = { sendToken };
