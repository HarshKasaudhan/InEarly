"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseWebcamStreamOptions {
  idealWidth?: number;
  idealHeight?: number;
  facingMode?: "user" | "environment";
}

export interface UseWebcamStreamReturn {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  startStream: () => Promise<MediaStream | null>;
  stopStream: () => void;
  setVideoRef: (node: HTMLVideoElement | null) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  captureFrameBase64: (quality?: number) => string | null;
}

export function useWebcamStream(options: UseWebcamStreamOptions = {}): UseWebcamStreamReturn {
  const {
    idealWidth = 640,
    idealHeight = 480,
    facingMode = "user",
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Bind video element whenever it mounts or when stream updates
  const attachStreamToVideo = useCallback((videoEl: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
    if (!videoEl || !mediaStream) return;

    try {
      if (videoEl.srcObject !== mediaStream) {
        videoEl.srcObject = mediaStream;
      }
      videoEl.muted = true;
      videoEl.setAttribute("playsinline", "true");
      videoEl.setAttribute("webkit-playsinline", "true");

      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // AbortError can safely be ignored on rapid unmounts
          if (err.name !== "AbortError") {
            console.warn("[useWebcamStream] Video play deferred/failed:", err);
          }
        });
      }
    } catch (e) {
      console.warn("[useWebcamStream] Error attaching stream to video:", e);
    }
  }, []);

  // Callback ref: ensures conditionally rendered <video> elements immediately receive the stream upon mounting
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      attachStreamToVideo(node, streamRef.current);
    }
  }, [attachStreamToVideo]);

  // Keep attached if stream state updates while node is already mounted
  useEffect(() => {
    if (videoRef.current && stream) {
      attachStreamToVideo(videoRef.current, stream);
    }
  }, [stream, attachStreamToVideo]);

  // Start webcam stream
  const startStream = useCallback(async (): Promise<MediaStream | null> => {
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const msg = "Webcam API is not supported in this browser environment.";
      setError(msg);
      return null;
    }

    // Reuse existing live stream if active
    if (streamRef.current && streamRef.current.active) {
      const activeTracks = streamRef.current.getVideoTracks().filter((t) => t.readyState === "live");
      if (activeTracks.length > 0) {
        setStream(streamRef.current);
        setIsActive(true);
        if (videoRef.current) {
          attachStreamToVideo(videoRef.current, streamRef.current);
        }
        return streamRef.current;
      }
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: idealWidth },
          height: { ideal: idealHeight },
          facingMode,
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        attachStreamToVideo(videoRef.current, mediaStream);
      }

      return mediaStream;
    } catch (err: any) {
      console.error("[useWebcamStream] getUserMedia error:", err);
      const userMessage =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser address bar."
          : err.name === "NotFoundError" || err.name === "DevicesNotFoundError"
          ? "No physical webcam camera device was found on this system."
          : `Failed to access webcam: ${err.message || "Unknown error"}`;
      setError(userMessage);
      setIsActive(false);
      return null;
    }
  }, [idealWidth, idealHeight, facingMode, attachStreamToVideo]);

  // Stop webcam stream cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsActive(false);
  }, []);

  // Frame capture utility
  const captureFrameBase64 = useCallback((quality: number = 0.88): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return null;
    }

    const width = video.videoWidth || idealWidth;
    const height = video.videoHeight || idealHeight;
    if (!width || !height) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  }, [idealWidth, idealHeight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    stream,
    isActive,
    error,
    startStream,
    stopStream,
    setVideoRef,
    videoRef,
    captureFrameBase64,
  };
}
