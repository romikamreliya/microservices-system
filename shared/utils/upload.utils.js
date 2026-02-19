const multer = require("multer");
const path = require("path");
const fs = require("fs");

class UploadUtility {
  constructor(uploadDir = "public/upload") {
    this.uploadDir = path.join(process.cwd(), uploadDir);
    this.allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  }

  initializeUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        this.initializeUploadDir();
        cb(null, this.uploadDir);
      } catch (err) {
        cb(new Error(`Failed to create upload directory: ${err.message}`));
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      const name = path.basename(file.originalname, ext).replace(/\s+/g, "-");
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  });

  fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(", ")}`));
    }

    if (!this.allowedExtensions.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed extensions: ${this.allowedExtensions.join(", ")}`));
    }

    cb(null, true);
  };

  getUploadMiddleware() {
    return multer({
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: { fileSize: this.maxFileSize },
    });
  }

  // ===>  Utility method 

  // delete uploaded file
  deleteFile(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  // get file info
  getFileInfo(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        return {
          filename,
          size: stats.size,
          created: stats.birthtime,
          path: filepath,
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}
module.exports = UploadUtility;
