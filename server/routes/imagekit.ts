import express from "express";
import ImageKit from "imagekit";

const router = express.Router();

// Lazy initialization of ImageKit to avoid crashing on startup if key is missing
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

router.post("/upload", async (req, res) => {
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

    res.json({
      url: result.url,
      fileId: result.fileId
    });
  } catch (error: any) {
    console.error("[ImageKit Backend Upload Error]:", error);
    res.status(500).json({ 
      error: "فشل رفع الصورة إلى خوادم التخزين المؤقت", 
      message: error.message || String(error) 
    });
  }
});

export default router;
