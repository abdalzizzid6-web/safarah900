
export const resolveImageUrl = (src: string | undefined | null): string | undefined => {
  if (!src) return undefined;
  
  // If it's already a full URL, return it
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  
  const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  
  if (!endpoint) return src; // Fallback to raw string if no endpoint
  
  // Ensure endpoint doesn't end with slash and src starts with slash
  const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  const cleanSrc = src.startsWith('/') ? src : `/${src}`;
  
  return `${cleanEndpoint}${cleanSrc}`;
};

export const getOptimizedImageUrl = (src: string | undefined | null, width?: number, height?: number): string | undefined => {
  const resolved = resolveImageUrl(src);
  if (!resolved) return undefined;
  
  // Only apply transformations if it's an ImageKit URL
  const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  if (endpoint && resolved.startsWith(endpoint)) {
    const transformations = [];
    if (width) transformations.push(`w-${width}`);
    if (height) transformations.push(`h-${height}`);
    
    if (transformations.length > 0) {
      const separator = resolved.includes('?') ? '&' : '?';
      return `${resolved}${separator}tr=${transformations.join(',')}`;
    }
  }
  
  return resolved;
};
