"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Video, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { parseVideoUrl } from "@/lib/videoUtils";

interface ServiceVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null | undefined;
  videoPlatform?: string | null;
  serviceName?: string;
}

export default function ServiceVideoModal({
  isOpen,
  onClose,
  videoUrl,
  videoPlatform,
  serviceName = "Treatment Showcase",
}: ServiceVideoModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const parsed = parseVideoUrl(videoUrl, videoPlatform);

  if (!parsed) return null;

  const isPortrait = parsed.isPortrait;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={`p-0 overflow-hidden bg-slate-950 border-slate-800 text-white shadow-2xl transition-all duration-300 flex flex-col justify-between ${
          isFullscreen
            ? "w-screen h-screen max-w-none max-h-none rounded-none top-0 left-0 translate-x-0 translate-y-0"
            : isPortrait
            ? "max-w-md w-[92vw] h-[85vh] rounded-2xl"
            : "max-w-5xl w-[95vw] h-[85vh] max-h-[90vh] rounded-2xl"
        }`}
      >
        <DialogDescription className="sr-only">
          {serviceName} showcase video player
        </DialogDescription>

        {/* Header Bar with Single Clean Close & Fullscreen Toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-extrabold text-xs sm:text-sm text-slate-100 truncate">
                {serviceName}
              </DialogTitle>
              <p className="text-[10px] text-amber-400 font-semibold tracking-wide">
                {isPortrait ? "Short Treatment Video" : "Treatment Demonstration Video"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Full Screen */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Full Screen Mode"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* SINGLE Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close video"
            >
              <X className="w-5 h-5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          {parsed.isDirectVideo ? (
            <video
              src={parsed.embedUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : parsed.platform === "youtube_shorts" || parsed.platform === "youtube" || parsed.platform === "vimeo" ? (
            <iframe
              src={parsed.embedUrl}
              title={`${serviceName} treatment video`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="p-8 text-center space-y-4">
              <p className="text-slate-300 text-sm">
                Watch treatment video on external provider
              </p>
              <a
                href={parsed.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-5 rounded-full text-xs shadow-md transition-all"
              >
                <span>Open Video Link</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
