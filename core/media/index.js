const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');

const S3_ENABLED = !!process.env.S3_ACCESS_KEY;
const uploadDir = path.join(__dirname, '../uploads');

// Initialize S3 Client
const s3 = S3_ENABLED ? new S3Client({
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // Required for Minio
}) : null;

// Storage configuration
const storage = S3_ENABLED ? multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET || 'envoys-media',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
}) : multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type.'));
        }
    }
});

const getStorageUsage = async () => {
    if (!S3_ENABLED) {
        try {
            const files = await fs.readdir(uploadDir);
            let totalSize = 0;
            for (const file of files) {
                const stats = await fs.stat(path.join(uploadDir, file));
                totalSize += stats.size;
            }
            return totalSize;
        } catch (e) {
            return 0;
        }
    }
    // TODO: Implement S3 usage calculation (slow for many files)
    return 0;
};

module.exports = {
  upload,
  getStorageUsage,
  S3_ENABLED
};
