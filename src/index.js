import "@babel/polyfill/noconflict";
import express from 'express'
import server from "./graphqlServer.js";
import multer from "multer";
import sharp from "sharp";

const fs = require("fs");
const path = require("path");
const imgPath = (category) =>
  path.join(__dirname, `./public/img/${category}`);
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 3000000,
  },
});

server.express.use(express.static('public'))
server.express.all('*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_ENDPOINT)
  next()
})

server.express.post(
  "/checkout/:category",
  upload.array("checkout", 3),
  async (req, res) => {
    //find the fileKeys based on the originalName
    const index = req.body.originalName
      .split(",")
      .findIndex((item) => item === req.files[0].originalname);
    //resize and rename by id + fileKeys
    sharp(req.files[0].buffer)
      .resize({
        width: 150,
        height: 150,
        fit: sharp.fit.contain,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFile(
        imgPath(req.params.category) +
          "/" +
          req.body.fileKeys.split(",")[index] +
          ".jpg"
      );
    res.send();
  }
);

server.express.delete(
  "/checkout/delete/:category/:fileName",
  async (req, res) => {
    fs.unlink(
      path.join(imgPath(req.params.category), `${req.params.fileName}`),
      (err) => {
        if (err) throw err;
      }
    );
    res.send();
  }
);

if (process.env.NODE_ENV === 'production') {
  server.express.use(server.express.static('client/bulid'))
  server.express.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'bulid', 'index.html'))
  })
}

server.start({ port: process.env.PORT || 4000 }, () => {
  console.log("The server is up.");
});
