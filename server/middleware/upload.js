const multer = require("multer");
const { isSupported } = require("../services/fileParser");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!isSupported(file.originalname)) {
      const err = new Error("File type not supported. Upload a CSV, XLS or XLSX file.");
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

module.exports = upload;
