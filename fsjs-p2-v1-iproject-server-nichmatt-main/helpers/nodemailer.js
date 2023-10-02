const nodemailer = require("nodemailer");

async function sendEmail(message, email, username) {
  const transpoter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ppconnectify@gmail.com",
      pass: "yrsebvwrfiicvcmy",
    },
  });
  transpoter.sendMail({
    from: "noreply",
    to: "rahmat.bussines456@gmail.com",
    subject: "RegistrationMail",
    text: "Dear" + username,
    html: message,
  });
  console.log("email terkirim");
}

module.exports = { sendEmail };
