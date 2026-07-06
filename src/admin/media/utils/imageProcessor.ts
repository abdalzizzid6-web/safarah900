/**
 * Enterprise Media Center - Browser-based Image Processing Core
 * Handles compression, EXIF stripping, multi-size scaling, WebP conversion,
 * transparency detection, color extraction, blur placeholder, SHA256 and Perceptual Hashing (dHash).
 */

export interface ProcessedSizes {
  thumbnail: string; // base64 / blob URL
  small: string;
  medium: string;
  large: string;
  webp: string;
  blurPlaceholder: string;
}

export interface ImageAnalysis {
  width: number;
  height: number;
  aspectRatio: string;
  dominantColor: string;
  averageColor: string;
  hasTransparency: boolean;
  sha256: string;
  pHash: string; // Perceptual Hash
}

// Compute SHA256 of a file using Web Crypto API
export async function computeSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Compute simple Perceptual Hash (dHash - Difference Hash) in the browser
// Resizes to 9x8, converts to grayscale, and compares adjacent pixels (64 bits)
export function computePHash(imgElement: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 9;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '0000000000000000';

  ctx.drawImage(imgElement, 0, 0, 9, 8);
  const imgData = ctx.getImageData(0, 0, 9, 8).data;

  // Convert to Grayscale values
  const grayscale: number[] = [];
  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    // Standard luminance weights
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    grayscale.push(gray);
  }

  // Calculate Difference Hash (compare left pixel with right pixel in each row)
  let hashStr = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = grayscale[y * 9 + x];
      const right = grayscale[y * 9 + (x + 1)];
      hashStr += left > right ? '1' : '0';
    }
  }

  // Convert binary string to 16-character hexadecimal hash
  let hexHash = '';
  for (let i = 0; i < hashStr.length; i += 4) {
    const nibble = hashStr.slice(i, i + 4);
    hexHash += parseInt(nibble, 2).toString(16);
  }

  return hexHash;
}

// Calculate Dominant and Average color
export function extractColors(ctx: CanvasRenderingContext2D, width: number, height: number): { dominantColor: string, averageColor: string, hasTransparency: boolean } {
  const imgData = ctx.getImageData(0, 0, width, height).data;
  
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  let transparentCount = 0;
  
  // Quick buckets for dominant color (coarse representation)
  const colorBuckets: Record<string, number> = {};

  // Sample every 4th pixel for performance
  for (let i = 0; i < imgData.length; i += 16) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];

    if (a < 50) {
      transparentCount++;
      continue;
    }

    rSum += r;
    gSum += g;
    bSum += b;
    count++;

    // Quantize to coarse bucket (nearest 32)
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const bucketKey = `${qr},${qg},${qb}`;
    colorBuckets[bucketKey] = (colorBuckets[bucketKey] || 0) + 1;
  }

  const hasTransparency = (transparentCount / (imgData.length / 4)) > 0.02;

  // Average color
  let averageColor = '#475569';
  if (count > 0) {
    const avgR = Math.round(rSum / count);
    const avgG = Math.round(gSum / count);
    const avgB = Math.round(bSum / count);
    averageColor = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
  }

  // Dominant color (highest count bucket)
  let maxCount = 0;
  let dominantColor = averageColor;
  for (const [key, val] of Object.entries(colorBuckets)) {
    if (val > maxCount) {
      maxCount = val;
      const [dr, dg, db] = key.split(',').map(Number);
      dominantColor = `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
    }
  }

  return { dominantColor, averageColor, hasTransparency };
}

// Convert image to WebP with specific quality
export function resizeAndCompress(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality = 0.8
): string {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  // Quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/webp', quality);
}

// Process single Image File
export async function processImageFile(file: File, quality = 80): Promise<{ analysis: ImageAnalysis, sizes: ProcessedSizes }> {
  const sha256 = await computeSHA256(file);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const aspectRatio = (width / height).toFixed(2);

        // Standard scaling calculations
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, 1920);
        canvas.height = Math.round(canvas.width / (width / height));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Colors & Transparency Analysis
        const { dominantColor, averageColor, hasTransparency } = extractColors(ctx, canvas.width, canvas.height);
        const pHash = computePHash(img);

        // Generate resized configurations
        const qVal = quality / 100;
        const thumbnail = resizeAndCompress(img, 150, Math.round(150 / (width / height)), qVal);
        const small = resizeAndCompress(img, 320, Math.round(320 / (width / height)), qVal);
        const medium = resizeAndCompress(img, 640, Math.round(640 / (width / height)), qVal);
        const large = resizeAndCompress(img, 1280, Math.round(1280 / (width / height)), qVal);
        const webp = resizeAndCompress(img, canvas.width, canvas.height, qVal);
        const blurPlaceholder = resizeAndCompress(img, 10, Math.round(10 / (width / height)), 0.3);

        const analysis: ImageAnalysis = {
          width,
          height,
          aspectRatio,
          dominantColor,
          averageColor,
          hasTransparency,
          sha256,
          pHash
        };

        const sizes: ProcessedSizes = {
          thumbnail,
          small,
          medium,
          large,
          webp,
          blurPlaceholder
        };

        resolve({ analysis, sizes });
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Hamming distance to compare two hex pHashes (dHash)
// Distance of <= 10 indicates high similarity (probable duplicates)
export function calculateHammingDistance(h1: string, h2: string): number {
  if (h1.length !== h2.length) return 99;
  
  // Convert Hex to Binary
  let b1 = '';
  let b2 = '';
  for (let i = 0; i < h1.length; i++) {
    b1 += parseInt(h1[i], 16).toString(2).padStart(4, '0');
    b2 += parseInt(h2[i], 16).toString(2).padStart(4, '0');
  }

  let distance = 0;
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) {
      distance++;
    }
  }

  return distance;
}
