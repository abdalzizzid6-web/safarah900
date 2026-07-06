export const uploadImage = async (file: File, folder: string): Promise<{ url: string; fileId: string }> => {
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  const base64 = await base64Promise;

  const res = await fetch("/api/imagekit/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: base64,
      fileName: file.name,
      folder: folder,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "فشل في رفع الصورة");
  }

  const result = await res.json();
  return {
    url: result.url,
    fileId: result.fileId,
  };
};

export const getOptimizedImageUrl = (url: string, width: number, height: number, quality: number = 80) => {
  if (!url) return '';
  const baseUrl = url.split('?')[0]; // Remove existing query params
  return `${baseUrl}?tr=w-${width},h-${height},q-${quality}`;
};
