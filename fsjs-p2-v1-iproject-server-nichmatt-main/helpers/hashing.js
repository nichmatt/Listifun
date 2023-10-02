const bcrypt = require("bcrypt");

function hashingPassword(password) {
  const salt = bcrypt.genSaltSync(8);
  const hash = bcrypt.hashSync(password, salt);

  return hash;
}

function comparePassword(password, userPassword) {
  const result = bcrypt.compareSync(password, userPassword);
  return result;
}

module.exports = { hashingPassword, comparePassword };
