"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function CameraCapture({
  shelfLabel,
  onChangeShelf,
  onConfirm,
}: {
  shelfLabel: string;
  onChangeShelf: () => void;
  onConfirm: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        setCameraError(
          "Couldn't access the camera. You can still pick a photo from your library below."
        );
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "shelf.jpg", { type: "image/jpeg" });
        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92
    );
  }

  function retake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChosen}
        className="hidden"
      />

      <div className="relative flex-1 overflow-hidden">
        {!previewUrl && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {previewUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={previewUrl} alt="Captured shelf" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence>
          {flash && (
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
          )}
        </AnimatePresence>

        {!previewUrl && ready && <GuideOverlay />}

        <div
          className="absolute top-0 inset-x-0 flex items-center justify-between px-4"
          style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}
        >
          <button
            onClick={onChangeShelf}
            className="bg-black/40 backdrop-blur text-white text-sm font-medium rounded-full px-4 py-2"
          >
            {shelfLabel}
          </button>
        </div>

        {cameraError && !previewUrl && (
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-white">
            <p className="mb-4">{cameraError}</p>
          </div>
        )}
      </div>

      <div
        className="bg-black px-6 pt-5 flex items-center justify-center"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 28px)" }}
      >
        {!previewUrl ? (
          <div className="flex items-center gap-8">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-white/70 text-sm font-medium w-16"
            >
              Library
            </button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={capture}
              disabled={!ready}
              className="w-20 h-20 rounded-full bg-white disabled:opacity-40 ring-4 ring-white/30"
            />
            <div className="w-16" />
          </div>
        ) : (
          <div className="flex items-center gap-4 w-full max-w-sm">
            <Button variant="secondary" size="lg" className="flex-1 !bg-white/10 !text-white !border-white/20" onClick={retake}>
              Retake
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => previewFile && onConfirm(previewFile)}
            >
              Use Photo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function GuideOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm aspect-[4/3] relative">
        {[
          "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
          "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
          "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
          "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
        ].map((cls, i) => (
          <div key={i} className={`absolute w-10 h-10 border-white/90 ${cls}`} />
        ))}
      </div>
      <p className="text-white/90 text-sm font-medium mt-6 bg-black/30 rounded-full px-4 py-2">
        Fit the whole shelf in the frame
      </p>
    </div>
  );
}
