import { Request, Response } from "express";

/**
 * A highly polished, server-side SEO render logging wrapper.
 * Intercepts res.send to capture, parse, and log fully rendered HTML and metadata 
 * before returning the response to the client.
 */
export function wrapSeoHandler(handler: (req: Request, res: Response) => Promise<any>) {
  return async (req: Request, res: Response) => {
    const originalSend = res.send;
    const reqUrl = req.url || "/";
    const startTime = Date.now();

    // Intercept res.send to capture the response body
    res.send = function (body: any): Response {
      const contentType = res.get("Content-Type") || "";
      const statusCode = res.statusCode;
      const duration = Date.now() - startTime;

      console.log(`[SEO-RENDER-LOG] --- START RENDER LOG ---`);
      console.log(`[SEO-RENDER-LOG] Request: ${req.method} ${reqUrl}`);
      console.log(`[SEO-RENDER-LOG] Status: ${statusCode}`);
      console.log(`[SEO-RENDER-LOG] Content-Type: ${contentType}`);
      console.log(`[SEO-RENDER-LOG] Execution Duration: ${duration}ms`);

      if (typeof body === "string") {
        if (contentType.includes("text/html")) {
          // Log HTML size and sample
          console.log(`[SEO-RENDER-LOG] Rendered HTML Size: ${body.length} characters`);
          console.log(`[SEO-RENDER-LOG] HTML Head Snippet:\n${body.substring(0, 800)}...`);

          // Extract and log main SEO tags
          const titleMatch = body.match(/<title>(.*?)<\/title>/i);
          const descMatch = body.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || 
                            body.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
          
          const ogTitle = body.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
          const ogDesc = body.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
          const ogImage = body.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
          const canonical = body.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);

          const metadata = {
            title: titleMatch ? titleMatch[1] : "N/A",
            description: descMatch ? descMatch[1] : "N/A",
            ogTitle: ogTitle ? ogTitle[1] : "N/A",
            ogDescription: ogDesc ? ogDesc[1] : "N/A",
            ogImage: ogImage ? ogImage[1] : "N/A",
            canonical: canonical ? canonical[1] : "N/A"
          };

          console.log(`[SEO-RENDER-LOG] Captured Metadata Object:`, JSON.stringify(metadata, null, 2));

          // Extract and log JSON-LD structured data blocks
          const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
          let match;
          let idx = 1;
          while ((match = jsonLdRegex.exec(body)) !== null) {
            try {
              const parsed = JSON.parse(match[1].trim());
              console.log(`[SEO-RENDER-LOG] Structured Data Block #${idx++} (@type: ${parsed["@type"] || "Unknown"}):`, JSON.stringify(parsed, null, 2));
            } catch (err) {
              console.log(`[SEO-RENDER-LOG] Structured Data Block #${idx++} (Unparseable JSON):`, match[1].trim().substring(0, 200) + "...");
            }
          }
        } else if (contentType.includes("xml")) {
          console.log(`[SEO-RENDER-LOG] Rendered XML Size: ${body.length} characters`);
          console.log(`[SEO-RENDER-LOG] XML Snippet (First 500 chars):\n${body.substring(0, 500)}...`);
        } else {
          console.log(`[SEO-RENDER-LOG] Response Snippet (First 200 chars):\n${body.substring(0, 200)}...`);
        }
      } else {
        console.log(`[SEO-RENDER-LOG] Non-string response body of type: ${typeof body}`);
      }

      console.log(`[SEO-RENDER-LOG] --- END RENDER LOG ---`);
      return originalSend.call(this, body);
    };

    try {
      return await handler(req, res);
    } catch (err) {
      console.error(`[SEO-RENDER-ERROR] Crash inside SEO Handler wrapper:`, err);
      throw err;
    }
  };
}
