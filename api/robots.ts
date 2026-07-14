import { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  const host = "https://korea90.xyz";
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.status(200).send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /vip
Disallow: /premium-services
Disallow: /*?*

Sitemap: ${host}/sitemap.xml`);
}
