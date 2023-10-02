const express = require("express");
const router = express.Router();
const { Controller } = require("../controllers/controller");
const { authentication } = require("../middleware/authentication");
const { authorization } = require("../middleware/roleauthorization");

router.get("/", (req, res) => {
  res.send("hello World");
});
router.post("/register", Controller.register);
router.patch("/register", authentication, Controller.editMember);
router.get("/user", authentication, Controller.findUser);

router.post("/login", Controller.login);
router.post("/glogin", Controller.glogin);
router.post(
  "/entertains",
  authentication,
  authorization,
  Controller.createEntertain
);
router.get("/entertains", Controller.readEntertain);
router.get("/entertains/:id", Controller.readEntertainId);

// midtrans
router.post("/generate-midtrans-token", authentication, Controller.midtrans);

router.post("/myentertains", authentication, Controller.createMyEntertain);
router.get("/myentertains", authentication, Controller.readMyEntertain);
router.patch("/myentertains/:id", authentication, Controller.editStatus);
router.put("/myentertains/:id", authentication, Controller.editDescription);
router.delete("/myentertains/:id", authentication, Controller.deleteList);

module.exports = router;
