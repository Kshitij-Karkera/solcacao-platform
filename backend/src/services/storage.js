/**
 * File storage for B2B brand vectors / tech packs (Student 4).
 * STORAGE_DRIVER=local -> saves under UPLOAD_DIR (served privately, not public)
 * STORAGE_DRIVER=azure -> Azure Blob Storage container (private)
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export const ALLOWED_MIME = new Set([
    "application/pdf",
    "image/svg+xml",
    "image/png",
    "image/jpeg",
    "application/postscript", // .ai / .eps
    "application/illustrator",
    "application/zip",
]);
export const ALLOWED_EXT = new Set([
    ".pdf",
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".ai",
    ".eps",
    ".zip",
]);

function safeName(original) {
    const ext = path.extname(original).toLowerCase();
    return `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
}

/** Persist an in-memory multer file. Returns { key, url }. */
export async function saveUpload(file) {
    const key = safeName(file.originalname);

    if (env.STORAGE_DRIVER === "azure") {
        const { BlobServiceClient } = await import("@azure/storage-blob");
        if (!env.AZURE_STORAGE_CONNECTION_STRING)
            throw new Error("AZURE_STORAGE_CONNECTION_STRING missing");
        const container = BlobServiceClient.fromConnectionString(
            env.AZURE_STORAGE_CONNECTION_STRING,
        ).getContainerClient(env.AZURE_STORAGE_CONTAINER);
        await container.createIfNotExists(); // private by default
        const blob = container.getBlockBlobClient(key);
        await blob.uploadData(file.buffer, { blobHTTPHeaders: { blobContentType: file.mimetype } });
        return { key, url: blob.url };
    }

    const full = path.resolve(env.UPLOAD_DIR, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, file.buffer);
    return { key, url: `local://${key}` };
}