import { Request, Response } from "express";
import ImageKit from "imagekit";

let imagekitInstance: ImageKit | null = null;

function getImageKit(): ImageKit {
  if (!imagekitInstance) {
    const publicKey = process.env.IMAGEKIT_PUBLIC || process.env.VITE_IMAGEKIT_PUBLIC || "";
    const privateKey = process.env.IMAGEKIT_PRIVATE || "";
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.VITE_IMAGEKIT_URL_ENDPOINT || "";

    if (!privateKey) {
      throw new Error("IMAGEKIT_PRIVATE key is missing in environment variables.");
    }

    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    });
  }
  return imagekitInstance;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { file, fileName, folder } = req.body;

  if (!file || !fileName) {
    return res.status(400).json({ error: "المعاملات file أو fileName مفقودة" });
  }

  try {
    const ik = getImageKit();
    const result = await ik.upload({
      file: file, // Base64 string
      fileName: fileName,
      folder: folder || "media"
    });

    return res.status(200).json({
      url: result.url,
      fileId: result.fileId
    });
  } catch (error: any) {
    console.error("[ImageKit Serverless Upload Error]:", error);
    return res.status(500).json({ 
      error: "فشل رفع الصورة إلى خوادم التخزين المؤقت", 
      message: error.message || String(error) 
    });
  }
}
