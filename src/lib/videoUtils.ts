export interface ParsedVideo {
  embedUrl: string;
  isDirectVideo: boolean;
  isPortrait: boolean;
  platform: 'youtube' | 'youtube_shorts' | 'vimeo' | 'direct' | 'external';
  originalUrl: string;
}

export function parseVideoUrl(url: string | null | undefined, platformHint?: string | null): ParsedVideo | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();

  // 1. YouTube Shorts: e.g. https://youtube.com/shorts/39cnnNHNqAM?si=...
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (shortsMatch && shortsMatch[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      isDirectVideo: false,
      isPortrait: true,
      platform: 'youtube_shorts',
      originalUrl: trimmed,
    };
  }

  // 2. Standard YouTube or Shortlink: youtube.com/watch?v=... or youtu.be/...
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      isDirectVideo: false,
      isPortrait: false,
      platform: 'youtube',
      originalUrl: trimmed,
    };
  }

  // 3. Vimeo: vimeo.com/12345678
  const vimeoMatch = trimmed.match(/vimeo\.com\/([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      isDirectVideo: false,
      isPortrait: false,
      platform: 'vimeo',
      originalUrl: trimmed,
    };
  }

  // 4. Direct video files (.mp4, .webm, .ogg, .mov)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      embedUrl: trimmed,
      isDirectVideo: true,
      isPortrait: false,
      platform: 'direct',
      originalUrl: trimmed,
    };
  }

  // 5. Fallback for external or custom platform
  return {
    embedUrl: trimmed,
    isDirectVideo: false,
    isPortrait: Boolean(platformHint && platformHint.toLowerCase().includes('short')),
    platform: 'external',
    originalUrl: trimmed,
  };
}
