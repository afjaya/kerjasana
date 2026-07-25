/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  Image as ImageIcon,
  User,
  Trash2,
  FlipHorizontal
} from "lucide-react";
import { AVATAR_PALETTES, generateInitialsAvatar, getInitials } from "../utils/avatarUtils";

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  userName: string;
  onSelectAvatar: (avatarUrl: string) => void;
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName,
  onSelectAvatar
}: AvatarPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "initials">("camera");

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Upload state
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initials state
  const [selectedPalette, setSelectedPalette] = useState("indigo");
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState("");

  // Initialize generated avatar whenever palette or userName changes
  useEffect(() => {
    if (userName) {
      const url = generateInitialsAvatar(userName, selectedPalette);
      setGeneratedAvatarUrl(url);
    }
  }, [userName, selectedPalette]);

  // Clean up camera stream when modal or camera tab closes
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen || activeTab !== "camera") {
      stopCameraStream();
    }
  }, [isOpen, activeTab]);

  // Start camera stream
  const startCamera = async (facing: "user" | "environment" = facingMode) => {
    stopCameraStream();
    setCameraError(null);
    setCapturedPhoto(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Perangkat atau browser Anda tidak mendukung akses kamera langsung.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Izin kamera ditolak. Harap beri izin akses kamera di pengaturan browser Anda.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("Kamera tidak ditemukan di perangkat Anda.");
      } else {
        setCameraError(err.message || "Gagal mengaktifkan kamera.");
      }
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Crop center square
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    // If user facing camera, mirror horizontal for natural selfie view
    if (facingMode === "user") {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(dataUrl);
    stopCameraStream();
  };

  const handleFlipCamera = () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Process uploaded image file
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file gambar (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Compress/resize image using canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setUploadedPhoto(canvas.toDataURL("image/jpeg", 0.85));
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = (url: string) => {
    onSelectAvatar(url);
    onClose();
  };

  const handleRemoveAvatar = () => {
    onSelectAvatar("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Atur Foto Profil Avatar</h3>
              <p className="text-xs text-slate-500">Pilih metode pembuatan atau unggah foto avatar Anda</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 px-6 bg-white">
          <button
            onClick={() => setActiveTab("camera")}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "camera"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-4 h-4" />
            Ambil Kamera
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "upload"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-4 h-4" />
            Unggah File
          </button>

          <button
            onClick={() => setActiveTab("initials")}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "initials"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Inisial Otomatis
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: KAMERA */}
          {activeTab === "camera" && (
            <div className="space-y-4 text-center">
              {capturedPhoto ? (
                /* Preview Hasil Foto Tangkapan */
                <div className="space-y-4 animate-fade-in">
                  <div className="relative w-44 h-44 mx-auto rounded-full overflow-hidden ring-4 ring-indigo-500/20 shadow-xl">
                    <img src={capturedPhoto} alt="Hasil Tangkapan" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Foto berhasil ditangkap!</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => startCamera()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Foto Ulang
                    </button>
                    <button
                      onClick={() => handleApply(capturedPhoto)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Gunakan Foto Ini
                    </button>
                  </div>
                </div>
              ) : cameraActive ? (
                /* Stream Kamera Aktif */
                <div className="space-y-4">
                  <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden bg-black shadow-inner border-2 border-indigo-500/30">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                    />
                    <div className="absolute inset-0 border-2 border-white/20 rounded-full m-6 pointer-events-none" />
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleFlipCamera}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                      title="Putar Kamera"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleCapture}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Ambil Foto
                    </button>
                  </div>
                </div>
              ) : (
                /* Tombol Mulai Kamera / Error Handler */
                <div className="py-6 space-y-4">
                  {cameraError ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
                      <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
                      <p className="font-medium">{cameraError}</p>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <Camera className="w-10 h-10" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      Gunakan Kamera Perangkat / Laptop Anda
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Ambil foto selfie langsung secara praktis dari webcam atau kamera smartphone.
                    </p>
                  </div>

                  <button
                    onClick={() => startCamera()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Aktifkan Kamera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UNGGAH FILE */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-slate-200 hover:border-indigo-300 bg-slate-50/50"
                }`}
              >
                {uploadedPhoto ? (
                  <div className="space-y-4">
                    <div className="w-36 h-36 mx-auto rounded-full overflow-hidden ring-4 ring-indigo-500/20 shadow-md">
                      <img src={uploadedPhoto} alt="Preview Unggahan" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        Ganti File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        />
                      </label>
                      <button
                        onClick={() => handleApply(uploadedPhoto)}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Gunakan Foto Ini
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Tarik & lepas foto di sini</p>
                      <p className="text-[11px] text-slate-400">Atau pilih file dari penyimpanan perangkat</p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Pilih Foto Komputer/HP
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INISIAL OTOMATIS */}
          {activeTab === "initials" && (
            <div className="space-y-5 text-center">
              <div className="space-y-2">
                <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden shadow-lg ring-4 ring-indigo-500/20">
                  <img src={generatedAvatarUrl} alt="Inisial Avatar" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-bold text-slate-800">Inisial: "{getInitials(userName)}"</p>
              </div>

              {/* Tema Warna Palette */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600">Pilih Tema Warna Gradiasi:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_PALETTES.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => setSelectedPalette(palette.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        selectedPalette === palette.id
                          ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow-xs"
                        style={{
                          background: `linear-gradient(135deg, ${palette.bgStart}, ${palette.bgEnd})`
                        }}
                      />
                      <span className="text-[10px] font-bold text-slate-700 truncate w-full">{palette.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleApply(generatedAvatarUrl)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Gunakan Avatar Inisial Ini
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions (Hapus Avatar jika ada) */}
        {currentAvatarUrl && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Foto profil saat ini terpasang.</span>
            <button
              onClick={handleRemoveAvatar}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Foto Profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
