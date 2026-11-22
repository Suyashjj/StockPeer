import multer from "multer";

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 3 },
    fileFilter: (_req, file, cb) =>
        ALLOWED.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error("Only JPG, PNG or PDF files are allowed")),
});