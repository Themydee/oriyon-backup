"use client";

import React, { useState } from "react";

export function parseVideoSource(url: string): {
  type: "youtube" | "vimeo" | "google" | "loom" | "video";
  embedUrl: string;
} {
  if (!url) return { type: "video", embedUrl: "" };
  const trimmed = url.trim();

  // YouTube match (watch?v=, youtu.be/, embed/, shorts/)
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Vimeo match (vimeo.com/ID, player.vimeo.com/video/ID)
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Loom match (loom.com/share/ID, loom.com/embed/ID)
  const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    return {
      type: "loom",
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`,
    };
  }

  // Google Drive match (drive.google.com/file/d/ID/view)
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^\/]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      type: "google",
      embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`,
    };
  }

  // Direct video file (Cloudinary, MP4, WebM, MOV, etc.)
  return { type: "video", embedUrl: trimmed };
}

interface UniversalVideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
}

export default function UniversalVideoPlayer({
  url,
  title = "Video Player",
  className = "w-full h-full rounded-xl",
  autoPlay = true,
}: UniversalVideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const source = parseVideoSource(url);

  if (!url || hasError) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <span className="text-3xl mb-2">⚠️</span>
        <p className="text-sm font-bold text-slate-200">Unable to load video</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Please check the video URL or try uploading a valid MP4/WebM file or pasting a YouTube/Vimeo link.
        </p>
      </div>
    );
  }

  if (source.type === "video") {
    return (
      <video
        src={source.embedUrl}
        controls
        autoPlay={autoPlay}
        playsInline
        onError={() => setHasError(true)}
        className={`${className} object-contain bg-slate-950`}
      >
        <source src={source.embedUrl} type="video/mp4" />
        <source src={source.embedUrl} type="video/webm" />
        Your browser does not support HTML5 video playback.
      </video>
    );
  }

  return (
    <iframe
      src={source.embedUrl}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      onError={() => setHasError(true)}
      className={`${className} border-0 bg-slate-950`}
    />
  );
}
