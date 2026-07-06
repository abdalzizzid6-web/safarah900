import "dotenv/config";
import ImageKit from "imagekit";

let imagekitClient: ImageKit | null = null;

export const getImageKitClient = (): ImageKit | null => {
  if (imagekitClient) return imagekitClient;

  const publicKey = process.env.IMAGEKIT_PUBLIC || process.env.VITE_IMAGEKIT_PUBLIC;
  const privateKey = process.env.IMAGEKIT_PRIVATE;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.VITE_IMAGEKIT_URL_ENDPOINT;

  if (publicKey && privateKey && urlEndpoint) {
    imagekitClient = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
    return imagekitClient;
  }
  
  console.error("ImageKit credentials are missing. Check IMAGEKIT_PUBLIC, IMAGEKIT_PRIVATE, and IMAGEKIT_URL_ENDPOINT.");
  return null;
};

export default getImageKitClient;
