const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const router = require("./routers/index.js");

const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(router);

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
