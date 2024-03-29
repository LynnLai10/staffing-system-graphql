import { v4 as uuidv4 } from 'uuid'
import server from "./graphqlServer.js";
import AWS from "aws-sdk"
import multer from "multer";
import sharp from "sharp";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
})

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 3000000,
  },
});

server.express.all('*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_ENDPOINT)
  next()
})

server.express.post(
  "/checkout/:category",
  upload.array("checkout", 3),
  async (req, res) => {
    //resize
    sharp(req.files[0].buffer)
      .resize({
        width: 150,
        height: 150,
        fit: sharp.fit.contain,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer().then(data => {
        const originalName = req.files[0].originalname.split('.')
        const fileName = uuidv4() + '.' + originalName[originalName.length-1]
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `${req.params.category}/${fileName}`,
          Body: data
        }
        s3.upload(params, (err, data) => {
          if (err) {
            res.status(500).send(err)
          }
          res.status(200).send(data)
        })
      }).catch(err => {
        res.status(500).send(err)
      })
  }
);

server.express.delete(
  "/checkout/delete/:category/:fileName",
  async (req, res) => {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${req.params.category}/${req.params.fileName}`,
    }
    s3.deleteObject(params, (err, data) => {
      if (err) {
        res.status(500).send(err)
      }
      res.status(200).send(data)
    })
  }
);

server.start({ port: process.env.PORT || 4000 }, () => {
  console.log("The server is up.");
});
