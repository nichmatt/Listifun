const { User } = require("../models");

const authorization = async (req, res, next) => {
  try {
    const { role } = req.user;
    if (!role) throw { message: "NotAuthorized" };
    if (role !== "member") throw { message: "NotAuthorized" };
    next();
  } catch (err) {
    // next(err);
    console.log(err);
  }
};

module.exports = { authorization };
