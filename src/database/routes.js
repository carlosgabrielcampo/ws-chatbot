const { Router } = require("express");
const WhatsController = require("./controllers/chat-whatsapp");
const multer = require("multer");
const path = require("path");
const routes = new Router();

const imageStorage = multer.diskStorage({
    // Destination to store image     
    destination: "./uploads/img", 
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() 
             + path.extname(file.originalname));
        // file.fieldname is name of the field (image)
        // path.extname get the uploaded file extension
    }
});
const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 20000000 // 1000000 Bytes = 1 MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg)$/)) { 
            // upload only png and jpg format
            return cb(new Error("Please upload a Image"));
        }
        cb(undefined, true);
    }
});
const videoStorage = multer.diskStorage({
    destination: "videos", // Destination to store video 
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() 
         + path.extname(file.originalname));
    }
});
const videoUpload = multer({
    storage: videoStorage,
    limits: {
        fileSize: 20000000 // 10000000 Bytes = 10 MB
    },
    fileFilter(req, file, cb) {
        // upload only mp4 and mkv format
        if (!file.originalname.match(/\.(mp4|MPEG-4|mkv)$/)) { 
            return cb(new Error("Please upload a video"));
        }
        cb(undefined, true);
    }
});
routes.post("/sendAudio", WhatsController.sendAudio);
routes.post("/sendMedia", imageUpload.single("image"), WhatsController.sendMidia);
routes.post("/sendVideo", videoUpload.single("video"), WhatsController.sendVideo);
routes.post("/send", WhatsController.sendText);
routes.post("/downloadMedia", WhatsController.download);
routes.get("/conversation/:id", WhatsController.sendMessageHistory);
// routes.get("/qrcode", Teste.takeQrCode);
module.exports = routes;