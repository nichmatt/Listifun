const { User } = require("../models");
const { verifyToken } = require("../helpers/jwt");

const authentication = async (req, res, next) => {
  try {
    const { access_token } = req.headers;
    if (!access_token) throw { message: "can't find account" };

    const payload = verifyToken(access_token);
    if (!payload) throw { message: "can't find account" };

    const result = await User.findByPk(payload.id);
    if (!result) throw { message: "can't find account" };
    console.log(result);
    req.user = {
      id: result.id,
      email: result.email,
      username: result.username,
      role: result.role,
    };
    next();
  } catch (err) {
    // next(err);
    console.log(err);
  }
};

module.exports = { authentication };
