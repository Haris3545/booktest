"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LocationPicker } from "@/components/scan/LocationPicker";
import { CameraCapture } from "@/components/scan/CameraCapture";
import { UploadingOverlay } from "@/components/scan/UploadingOverlay";

type Step = "picker" | "camera" | "uploading" | "error";

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("picker");
  const [shelfId, setShelfId] = useState<string | null>(null);
  const [shelfLabel, setShelfLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(file: File) {
    if (!shelfId) return;
    setStep("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("shelfId", shelfId);
      formData.append("image", file);

      const res = await fetch("/api/scan", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong scanning that shelf.");
      }

      router.push(`/scan/review?scanId=${data.scanId}`);
    } catch (err) {
      setError((err as Error).message);
      setStep("error");
    }
  }

  if (step === "picker") {
    return (
      <main className="max-w-lg mx-auto px-5 pt-6">
        <LocationPicker
          onSelect={(id, label) => {
            setShelfId(id);
            setShelfLabel(label);
            setStep("camera");
          }}
        />
      </main>
    );
  }

  if (step === "camera") {
    return (
      <CameraCapture
        shelfLabel={shelfLabel}
        onChangeShelf={() => setStep("picker")}
        onConfirm={handleConfirm}
      />
    );
  }

  if (step === "uploading") {
    return <UploadingOverlay />;
  }

  return (
    <main className="max-w-lg mx-auto px-5 pt-6">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-10"
        >
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Couldn&apos;t scan that shelf</h2>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={() => setStep("camera")}
            className="bg-accent text-accent-foreground rounded-2xl px-6 py-3 font-medium"
          >
            Try again
          </button>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
