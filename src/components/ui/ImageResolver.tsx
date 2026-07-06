import React, { useState, useEffect, forwardRef } from 'react';
import { getTeamLogoUrl } from '../../utils/teamUtils';
import { resolveImageUrl } from '../../lib/imageUtils';

export interface ImageResolverProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  fallbackType?: 'team' | 'player' | 'league' | 'default';
  fallbackText?: string;
  tla?: string;
  maxRetries?: number;
}

const FALLBACK_IMAGES = {
  team: 'https://cdn-icons-png.flaticon.com/512/8853/8853459.png',
  player: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
  league: 'https://cdn-icons-png.flaticon.com/512/3252/3252327.png',
  default: 'https://cdn-icons-png.flaticon.com/512/8853/8853459.png'
};

export const ImageResolver = forwardRef<HTMLImageElement, ImageResolverProps>(({
  src,
  fallbackType = 'default',
  fallbackText = '',
  tla = '',
  maxRetries = 2,
  className,
  alt,
  onError,
  ...props
}, ref) => {
  const resolvedSrc = resolveImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(resolvedSrc);
  const [errorCount, setErrorCount] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    const newResolvedSrc = resolveImageUrl(src);
    if (fallbackType === 'team' && fallbackText && (!newResolvedSrc || newResolvedSrc.trim() === '')) {
      setCurrentSrc(getTeamLogoUrl(undefined, fallbackText, tla));
    } else {
      setCurrentSrc(newResolvedSrc);
    }
    setErrorCount(0);
    setHasFailed(false);
  }, [src, fallbackType, fallbackText, tla]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (errorCount < maxRetries && currentSrc && !currentSrc.includes('retry=')) {
      setErrorCount((prev) => prev + 1);
      const separator = currentSrc.includes('?') ? '&' : '?';
      setCurrentSrc(`${currentSrc}${separator}retry=${errorCount + 1}`);
    } else {
      setHasFailed(true);
      if (fallbackType === 'team' && fallbackText) {
        setCurrentSrc(getTeamLogoUrl(undefined, fallbackText, tla));
      } else {
        setCurrentSrc(FALLBACK_IMAGES[fallbackType]);
      }
    }
    if (onError) onError(e);
  };

  if (hasFailed && !FALLBACK_IMAGES[fallbackType] && fallbackType !== 'team') {
    return (
      <div className={`flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-500 ${className}`}>
        {fallbackText ? fallbackText.substring(0, 2).toUpperCase() : '?'}
      </div>
    );
  }

  return (
    <img
      ref={ref}
      src={currentSrc || (fallbackType === 'team' && fallbackText ? getTeamLogoUrl(undefined, fallbackText, tla) : FALLBACK_IMAGES[fallbackType])}
      alt={alt || fallbackText || 'Image'}
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
});

ImageResolver.displayName = 'ImageResolver';

export default ImageResolver;
