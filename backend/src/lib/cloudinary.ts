import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import crypto from "crypto";

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
});

type UploadOptions = { folder: string; isPrivate: boolean };

export function uploadFile(file: Express.Multer.File, { folder, isPrivate }: UploadOptions) {
    return new Promise<{ publicId: string; url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `stockpeer/${folder}`,
                resource_type: "image", // also accepts PDF
                type: isPrivate ? "authenticated" : "upload",
            },
            (err, result) => {
                if (err || !result) return reject(err ?? new Error("Upload failed"));
                resolve({ publicId: result.public_id, url: result.secure_url });
            }
        );
        stream.end(file.buffer);
    });
}

// Private upload for chat files. Images use "image", everything else uses "raw".
export function uploadChatFile(buffer: Buffer, opts: { isImage: boolean; ext: string }) {
    const id = crypto.randomUUID();
    return new Promise<{ publicId: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "stockpeer/chat",
                public_id: opts.isImage ? id : `${id}.${opts.ext}`,
                resource_type: opts.isImage ? "image" : "raw",
                type: "authenticated",
            },
            (err, result) => {
                if (err || !result) return reject(err ?? new Error("Upload failed"));
                resolve({ publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
}

// Signed link for a private chat file. Only call this for group members.
export function chatFileUrl(publicId: string, isImage: boolean, download = false) {
    return cloudinary.url(publicId, {
        type: "authenticated",
        sign_url: true,
        secure: true,
        resource_type: isImage ? "image" : "raw",
        ...(download ? { flags: "attachment" } : {}),
    });
}

// For private files. Only call this from admin-only code.
export function signedUrl(publicId: string) {
    return cloudinary.url(publicId, {
        type: "authenticated",
        sign_url: true,
        secure: true,
        resource_type: "image",
    });
}