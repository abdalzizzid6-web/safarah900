import { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  const method = req.method;
  const action = req.query.action as string;

  try {
    const { default: ImageKit } = await import("imagekit");
    
    let imagekitInstance: any = null;

    function getImageKit(): any {
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

    const ik = getImageKit();
    // ... rest of the handler

    // --- 1. UPLOAD IMAGE (POST /api/imagekit?action=upload) ---
    if (action === "upload" || (method === "POST" && !action)) {
      if (method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: "Method Not Allowed" });
      }

      const { file, fileName, folder } = req.body;
      if (!file || !fileName) {
        return res.status(400).json({ error: "المعاملات file أو fileName مفقودة" });
      }

      const result = await ik.upload({
        file: file, // Base64 string
        fileName: fileName,
        folder: folder || "media"
      });

      return res.status(200).json({
        url: result.url,
        fileId: result.fileId
      });
    }

    // --- 2. FILE OPERATIONS (GET / DELETE) ---
    if (action === "files" || (!action && (method === "GET" || method === "DELETE"))) {
      if (method === "GET") {
        const folderPath = (req.query.path as string) || "/media";
        const cleanPath = folderPath === "/" ? "media" : folderPath.replace(/^\//, "");

        const files = await ik.listFiles({
          path: cleanPath,
          limit: 100
        });

        return res.status(200).json(files);
      }

      if (method === "DELETE") {
        const fileId = (req.query.fileId as string);
        if (!fileId) {
          return res.status(400).json({ error: "معرف الملف (fileId) مطلوب لإجراء الحذف" });
        }

        await ik.deleteFile(fileId);
        return res.status(200).json({ success: true, message: "تم حذف الملف بنجاح" });
      }
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });

  } catch (error: any) {
    console.error(`[ImageKit Serverless Error] Method: ${method}, Action: ${action}, Error:`, error);
    return res.status(500).json({
      error: "فشل الاتصال بخوادم التخزين المؤقت",
      message: error.message || String(error)
    });
  }
}
