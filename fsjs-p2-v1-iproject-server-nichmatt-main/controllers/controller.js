const { comparePassword } = require("../helpers/hashing");
const { generateToken } = require("../helpers/jwt");
const { User, Entertain, MyEntertain } = require("../models");
const myentertain = require("../models/myentertain");
const axios = require("axios");
const { Op } = require("sequelize");
const midtransClient = require("midtrans-client");
const { sendEmail } = require("../helpers/nodemailer");
const { OAuth2Client } = require("google-auth-library");

class Controller {
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      console.log(req.body);
      const result = await User.create({
        username,
        email,
        password,
        role: "not member",
      });
      const message = `
      <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kartu Ucapan Berhasil Register</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #000000; /* Background berwarna hitam */
        }

        .container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
        }

        .card {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
        }

        h1 {
            color: #2c3e50;
            font-size: 36px;
            margin-bottom: 20px;
        }

        p {
            color: #444444;
            font-size: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>ListiFun</h1> <!-- Tulisan "ListiFun" ditambahkan di sini -->
            <p>Anda berhasil melakukan registrasi.</p>
        </div>
    </div>
</body> `;
      sendEmail(message, email, username);
      res.status(201).json({
        id: result.id,
        email: result.email,
        role: result.role,
      });
    } catch (err) {
      next(err);
    }
  }

  static async findUser(req, res, next) {
    const { id } = req.user;
    const result = await User.findByPk(id);
    res.status(200).json(result);
  }

  static async editMember(req, res, next) {
    try {
      const { id } = req.user;

      const result = await User.update(
        { role: "member" },
        {
          where: {
            id,
          },
        }
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json(err.message);
    }
  }

  static async login(req, res, next) {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        throw { message: "Email and Password are required" };
      }
      const result = await User.findOne({ where: { email } });
      if (!result)
        throw {
          name: "Invalid Account",
        };
      const isValidPassword = comparePassword(password, result.password);
      console.log(isValidPassword);

      if (!isValidPassword)
        throw {
          name: "Invalid Account",
        };
      const token = generateToken({
        id: result.id,
        username: result.username,
        email: result.email,
        role: result.role,
      });

      res.status(200).json({
        access_token: token,
        username: result.username,
        role: result.role,
      });
    } catch (err) {
      console.log(err);
    }
  }

  static async midtrans(req, res, next) {
    try {
      const findUser = await User.findByPk(req.user.id);
      if (findUser.role === "Member") throw { message: "already subscribed" };
      // Create Snap API instance
      let snap = new midtransClient.Snap({
        // Set to true if you want Production Environment (accept real transaction).
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
      });

      let parameter = {
        transaction_details: {
          order_id:
            "TRANSACTION_" + Math.floor(1000000 + Math.random() * 9000000),
          gross_amount: 10000,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          name: findUser.userName,
          // last_name: "pratama",
          email: findUser.email,
          // phone: "08111222333",
        },
      };

      const midtransToken = await snap.createTransaction(parameter);
      console.log(midtransToken, "<<<<<token");
      res.status(201).json(midtransToken);
    } catch (error) {}
  }

  static async glogin(req, res, next) {
    try {
      //   console.log(req.headers.google_token);
      const { google_token } = req.headers;
      //   console.log(google_token, "ini google token nya");

      const client = new OAuth2Client();
      console.log(",masuk google login");
      const ticket = await client.verifyIdToken({
        idToken: google_token,
        audience: process.env.CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
      });
      console.log(ticket, "ini ticketnya");
      const payload = ticket.getPayload();
      console.log(payload, "ini payloadnya");

      const [user, created] = await User.findOrCreate({
        where: { email: payload.email },
        defaults: {
          username: payload.name,
          email: payload.email,
          password: "googlelogin",
          role: "not member",
        },
        hooks: false,
      });

      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
      // console.log(token,141414)
      res.status(200).json({
        access_token: token,
        username: user.username,
        role: user.role,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err.message);
    }
  }

  static async readEntertain(req, res, next) {
    try {
      const { limit, page, name } = req.query;
      console.log(limit, page, name, "<<ini lpg");

      const filter = {};
      if (name) {
        filter.title = { [Op.iLike]: `%${name}%` };
      }
      const form = {
        where: filter,
        order: [["id", "DESC"]],
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      };

      if (limit) form.limit = +limit;
      if (page) form.offset = (+page - 1) * +limit;

      const result = await Entertain.findAll(form);

      res.status(200).json(result);
    } catch (err) {
      //   next(err);
      console.log(err);
    }
  }

  static async readEntertainId(req, res, next) {
    try {
      const { id } = req.params;
      const result = await Entertain.findByPk(id, {
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      });

      const { data } = await axios.post(
        "https://api.qr-code-generator.com/v1/create?access-token=WFQr1pnSrhhH0hG4L_BFk_WeU--0D6VkA33O-_J4GCal891pkrCMo5YJWyrW6-i7",
        {
          frame_name: "no-frame",
          qr_code_text: `https://brandedplus-customer.web.app/`,
          image_format: "SVG",
          qr_code_logo: "scan-me-square",
        }
      );

      res.status(200).json([result, { qr: data }]);
    } catch (err) {
      //   next(err);
      console.log(err);
    }
  }

  static async createEntertain(req, res, next) {
    try {
      const { title, imageUrl, description, link } = req.body;
      const result = await Entertain.create({
        title,
        imageUrl,
        description,
        link,
      });

      res.status(201).json({
        result,
      });
    } catch (err) {
      //   next(err);
      console.log(err);
      if ((err.name = "SequelizeValidationError"))
        res.status(500).json(err.message);
    }
  }

  static async createMyEntertain(req, res, next) {
    try {
      const { id: UserId } = req.user;
      const { EntertainId, description } = req.body;

      const result = await MyEntertain.create({
        UserId,
        EntertainId,
        description: description || "no description",
        status: "incomplete",
      });

      res.status(200).json({
        result,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  }

  static async readMyEntertain(req, res, next) {
    try {
      const { id: UserId } = req.user;
      const result = await MyEntertain.findAll({
        where: {
          UserId,
        },
        include: Entertain,
        order: [["id", "DESC"]],
      });

      res.status(200).json(result);
    } catch (err) {
      //   next(err);
      console.log(err);
    }
  }

  static async editStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await MyEntertain.update(
        { status },
        {
          where: {
            id: +id,
          },
        }
      );
      res.status(200).json({
        message: "success updated",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }

  static async editDescription(req, res, next) {
    try {
      const { id } = req.params;
      const { description } = req.body;
      const result = await MyEntertain.update(
        { description },
        {
          where: {
            id: +id,
          },
        }
      );
      res.status(200).json({
        message: "success updated",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
  static async deleteList(req, res, next) {
    try {
      const { id } = req.params;
      // const { description } = req.body;
      const result = await MyEntertain.destroy({
        where: {
          id: +id,
        },
      });
      res.status(200).json({
        message: "success deleted",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json(error.message);
    }
  }
}

module.exports = { Controller };
