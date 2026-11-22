export type Detected = { mime: string; ext: string };

const has = (b: Buffer, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);

export function detectFile(buf: Buffer, originalName: string): Detected | null {
    const ext = (originalName.split(".").pop() ?? "").toLowerCase();

    if (has(buf, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
    if (has(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        return { mime: "image/png", ext: "png" };
    }
    if (has(buf, [0x52, 0x49, 0x46, 0x46]) && has(buf, [0x57, 0x45, 0x42, 0x50], 8)) {
        return { mime: "image/webp", ext: "webp" };
    }
    if (buf.subarray(0, 1024).includes("%PDF")) return { mime: "application/pdf", ext: "pdf" };

    // Old Word / Excel (OLE container)
    if (has(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
        if (ext === "doc") return { mime: "application/msword", ext: "doc" };
        if (ext === "xls") return { mime: "application/vnd.ms-excel", ext: "xls" };
        return null;
    }

    // New Word / Excel (zip container)
    if (has(buf, [0x50, 0x4b, 0x03, 0x04])) {
        if (ext === "docx") {
            return {
                mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ext: "docx",
            };
        }
        if (ext === "xlsx") {
            return {
                mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ext: "xlsx",
            };
        }
        return null;
    }

    // Plain text: must have no binary bytes
    if (ext === "txt" && !buf.subarray(0, 4096).includes(0)) {
        return { mime: "text/plain", ext: "txt" };
    }

    return null;
}

// Keeps only the file name, and removes odd characters
export function cleanFileName(name: string) {
    const base = name.split(/[\\/]/).pop() ?? "file";
    return base.replace(/[^\w.\- ()]/g, "_").slice(-120) || "file";
}