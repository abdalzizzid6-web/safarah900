import { Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import seoHandler from "./seo";

export default async function handler(req: Request, res: Response) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    seo: {
      robots: { exists: false, content: null, error: null },
      sitemap: { exists: false, content: null, error: null },
      seoHandlerTest: { status: "pending", result: null, error: null }
    }
  };

  try {
    const robotsPath = path.join(process.cwd(), "robots.txt");
    try {
      debugInfo.seo.robots.exists = true;
      debugInfo.seo.robots.content = await fs.readFile(robotsPath, "utf-8");
    } catch (e: any) {
      debugInfo.seo.robots.error = e.message;
    }

    const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
    try {
      debugInfo.seo.sitemap.content = await fs.readFile(sitemapPath, "utf-8");
      debugInfo.seo.sitemap.exists = true;
    } catch (e: any) {
      debugInfo.seo.sitemap.exists = false;
      debugInfo.seo.sitemap.error = "File not found at /public/sitemap.xml";
    }

    try {
      const mockRes: any = {
        setHeader: () => {},
        status: (code: number) => {
          mockRes.statusCode = code;
          return mockRes;
        },
        send: (body: any) => {
          mockRes.body = body;
          return mockRes;
        },
        json: (body: any) => {
          mockRes.body = body;
          return mockRes;
        }
      };

      const mockReq: any = {
        url: "/",
        query: { action: "robots" }
      };

      await seoHandler(mockReq, mockRes);
      debugInfo.seo.seoHandlerTest.status = "success";
      debugInfo.seo.seoHandlerTest.result = mockRes.body;
      debugInfo.seo.seoHandlerTest.statusCode = mockRes.statusCode;
    } catch (e: any) {
      debugInfo.seo.seoHandlerTest.status = "failed";
      debugInfo.seo.seoHandlerTest.error = e.message;
      debugInfo.seo.seoHandlerTest.stack = e.stack;
    }

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(200).json(debugInfo);
  } catch (e: any) {
    debugInfo.error = e.message;
    res.status(500).json(debugInfo);
  }
}
