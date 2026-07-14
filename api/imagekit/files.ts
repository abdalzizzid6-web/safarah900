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
  const method = req.method;

  try {
    const ik = getImageKit();

    // --- GET /api/imagekit/files (List Files) ---
    if (method === "GET") {
      const folderPath = (req.query.path as string) || "/media";
      
      // ImageKit listFiles takes folder path without trailing slash
      const cleanPath = folderPath === "/" ? "media" : folderPath.replace(/^\//, "");

      const files = await ik.listFiles({
        path: cleanPath,
        limit: 100
      });

      // Format to match what frontend expects if needed, or return directly
      return res.status(200).json(files);
    }

    // --- DELETE /api/imagekit/files/:fileId (Delete File) ---
    if (method === "DELETE") {
      const fileId = (req.query.fileId as string);

      if (!fileId) {
        return res.status(400).json({ error: "معرف الملف (fileId) مطلوب لإجراء الحذف" });
      }

      await ik.deleteFile(fileId);
      return res.status(200).json({ success: true, message: "تم حذف الملف بنجاح" });
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });

  } catch (error: any) {
    console.error(`[ImageKit Serverless Files Error] Method: ${method}, Error:`, error);
    return res.status(500).json({
      error: "فشل الاتصال بخوادم التخزين المؤقت",
      message: error.message || String(error)
    });
  }
}
