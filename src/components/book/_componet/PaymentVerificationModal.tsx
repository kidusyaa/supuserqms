"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { Icon } from "@iconify/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import type { Booking, Company, Service, Provider } from "@/type";
import { cn } from "@/lib/utils";

interface PaymentVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  service: Service;
  company: Company;
  selectedProvider: Provider;
  onSuccess?: () => void;
}

type ModalState = "upload" | "uploading" | "verifying" | "approved" | "rejected";

export default function PaymentVerificationModal({
  open,
  onOpenChange,
  booking,
  service,
  company,
  selectedProvider,
  onSuccess,
}: PaymentVerificationModalProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trigger celebration confetti
  const fireCelebration = useCallback(() => {
    try {
      const end = Date.now() + 2 * 1000;
      const colors = ["#10B981", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (err) {
      console.warn("Confetti effect failed:", err);
    }
  }, []);

  // Reset state when modal opens for a new booking
  useEffect(() => {
    if (open) {
      if (booking?.payment_status === "approved") {
        setModalState("approved");
      } else if (booking?.payment_status === "rejected") {
        setModalState("rejected");
      } else {
        setModalState("upload");
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadError(null);
    }
  }, [open, booking?.id, booking?.payment_status]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Copy bank account to clipboard
  const handleCopyAccount = async (accountNumber: string, index: number) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedIndex(index);
      toast.success("Account number copied!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy account number.");
    }
  };

  // Handle file selection
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Validate type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (.png, .jpg, .jpeg, .webp)");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Submit payment proof to Edge Function
  const handleSubmitProof = async () => {
    if (!booking) {
      toast.error("Booking reference is missing.");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select or drop a payment receipt screenshot.");
      return;
    }

    setModalState("uploading");
    setUploadError(null);

    try {
      const edgeFunctionUrl = `${
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cxifbxhpwkxnsxxpaxwh.supabase.co"
      }/functions/v1/send-payment-proof`;

      const formData = new FormData();
      formData.append("booking_id", booking.id);
      formData.append("screenshot", selectedFile);

      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          apikey: anonKey,
          ...(anonKey ? { Authorization: `Bearer ${anonKey}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || `Upload failed with status ${response.status}`
        );
      }

      toast.success("Payment proof submitted successfully!");
      setModalState("verifying");
    } catch (err: any) {
      console.error("Payment proof submission error:", err);
      const errMsg = err.message || "Failed to upload payment proof. Please try again.";
      setUploadError(errMsg);
      toast.error(errMsg);
      setModalState("upload");
    }
  };

  // Realtime subscription + Polling when in "verifying" state
  useEffect(() => {
    if (modalState !== "verifying" || !booking?.id) return;

    const bookingId = booking.id;

    // 1. Supabase Realtime channel
    const channel = supabase
      .channel(`booking_verification_${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.payment_status === "approved") {
            setModalState("approved");
            fireCelebration();
          } else if (updated.payment_status === "rejected") {
            setModalState("rejected");
          }
        }
      )
      .subscribe();

    // 2. Fallback polling every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("id, status, payment_status")
          .eq("id", bookingId)
          .single();

        if (!error && data) {
          if (data.payment_status === "approved") {
            setModalState("approved");
            fireCelebration();
          } else if (data.payment_status === "rejected") {
            setModalState("rejected");
          }
        }
      } catch (err) {
        console.warn("Polling booking status error:", err);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [modalState, booking?.id, fireCelebration]);

  const activeBankAccounts = (company.bank_accounts || []).filter(
    (account) => account.is_active !== false
  );

  const parsedStartTime = booking?.start_time ? parseISO(booking.start_time) : null;
  const parsedEndTime = booking?.end_time ? parseISO(booking.end_time) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-slate-200 dark:border-slate-800"
        onInteractOutside={(e) => {
          // Prevent closing while uploading or verifying
          if (modalState === "uploading" || modalState === "verifying") {
            e.preventDefault();
          }
        }}
      >
        {/* ── Modal Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0",
                modalState === "approved"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : modalState === "rejected"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                  : modalState === "verifying"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-[#0f2937]/10 text-[#0f2937] dark:bg-slate-800 dark:text-white"
              )}
            >
              {modalState === "approved" && <Icon icon="solar:check-circle-bold" className="w-5 h-5" />}
              {modalState === "rejected" && <Icon icon="solar:danger-triangle-bold" className="w-5 h-5" />}
              {modalState === "verifying" && <Icon icon="solar:radar-2-bold" className="w-5 h-5 animate-spin" />}
              {(modalState === "upload" || modalState === "uploading") && (
                <Icon icon="solar:card-send-bold" className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                {modalState === "approved" && "Payment Verified & Booking Confirmed"}
                {modalState === "rejected" && "Payment Proof Verification Issue"}
                {modalState === "verifying" && "Verifying Payment Proof..."}
                {(modalState === "upload" || modalState === "uploading") && "Deposit / Prepayment Required"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {modalState === "approved" && "Your appointment has been confirmed by the provider."}
                {modalState === "rejected" && "The business was unable to approve your receipt screenshot."}
                {modalState === "verifying" && "Sent to company owner for real-time verification."}
                {(modalState === "upload" || modalState === "uploading") &&
                  `Transfer prepayment to ${company.name} and upload screenshot.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Modal Body Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* ════════════════════════════════════════════════════════════
              STATE 1: UPLOAD RECEIPT FORM
             ════════════════════════════════════════════════════════════ */}
          {(modalState === "upload" || modalState === "uploading") && (
            <div className="space-y-5">
              {/* Prepayment Amount Notice Box */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 dark:border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                    Required Prepayment
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    For <strong className="text-slate-900 dark:text-white">{service.name}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    ETB {service.prepayment_amount || service.price || "0"}
                  </div>
                  <span className="text-[10px] text-slate-500">Deposit required</span>
                </div>
              </div>

              {/* Company Bank Accounts Card */}
              {activeBankAccounts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Icon icon="solar:bank-bold" className="w-4 h-4 text-amber-500" />
                      <span>Transfer To {company.name}</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Tap to copy number</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {activeBankAccounts.map((account, idx) => (
                      <div
                        key={account.id || idx}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {account.account_type}
                            </span>
                            {account.account_user_name && (
                              <span className="text-[11px] text-slate-500 truncate">
                                ({account.account_user_name})
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                            {account.account_number}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyAccount(account.account_number, idx)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer",
                            copiedIndex === idx
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700"
                          )}
                        >
                          <Icon
                            icon={copiedIndex === idx ? "solar:check-read-linear" : "solar:copy-linear"}
                            className="w-3.5 h-3.5"
                          />
                          <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Icon icon="solar:camera-bold" className="w-4 h-4 text-amber-500" />
                    <span>Upload Transfer Receipt / Screenshot</span>
                    <span className="text-rose-500">*</span>
                  </span>
                  {selectedFile && (
                    <span className="text-[11px] text-emerald-600 font-medium">Image selected</span>
                  )}
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5",
                      isDragging
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100/70 hover:border-slate-400"
                    )}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                      <Icon icon="solar:gallery-add-bold" className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Click or drag &amp; drop transfer receipt screenshot
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Supports PNG, JPG, JPEG, WEBP (Max 10MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {previewUrl && (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-white">
                          <Image
                            src={previewUrl}
                            alt="Receipt Preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Ready to submit
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-8 px-2 text-slate-600 hover:text-slate-900"
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }}
                        className="text-xs h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Icon icon="solar:trash-bin-minimalistic-linear" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <Icon icon="solar:danger-circle-bold" className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STATE 2: VERIFYING / PULSE RADAR
             ════════════════════════════════════════════════════════════ */}
          {modalState === "verifying" && (
            <div className="py-8 px-2 text-center space-y-6">
              {/* Radar pulse animation */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping duration-1000" />
                <div className="absolute inset-2 rounded-full bg-amber-500/10 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0f2937] to-[#1b3d52] text-amber-400 flex items-center justify-center shadow-lg border border-amber-500/30">
                  <Icon icon="solar:shield-check-bold" className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Waiting for Business Verification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your payment receipt has been sent to{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{company.name}</strong> management via
                  Telegram bot (<strong>@gizeverfiy_bot</strong>).
                </p>
              </div>

              {/* Live status badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Listening for real-time manager approval...</span>
              </div>

              {booking && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-left text-xs space-y-1.5 max-w-xs mx-auto">
                  <div className="flex justify-between text-slate-500">
                    <span>Booking ID:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {booking.id}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Service:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                      {service.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Specialist:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedProvider.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STATE 3A: APPROVED & CONFIRMED
             ════════════════════════════════════════════════════════════ */}
          {modalState === "approved" && (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <Icon icon="solar:check-circle-bold" className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                  Payment Verified &amp; Confirmed!
                </h3>
                <p className="text-xs text-slate-500">
                  Your appointment deposit has been verified. See you soon!
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border shrink-0">
                    <Image
                      src={service.photo || "/placeholder.svg"}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {service.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{company.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {parsedStartTime ? format(parsedStartTime, "EEE, MMM d, yyyy") : "Scheduled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Time</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {parsedStartTime && parsedEndTime
                        ? `${format(parsedStartTime, "h:mm a")} - ${format(parsedEndTime, "h:mm a")}`
                        : "Scheduled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Specialist</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedProvider.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Deposit Verified</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ETB {service.prepayment_amount || service.price || "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STATE 3B: REJECTED STATE
             ════════════════════════════════════════════════════════════ */}
          {modalState === "rejected" && (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
                <Icon icon="solar:close-circle-bold" className="w-9 h-9" />
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                  Payment Proof Not Approved
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  The business was unable to verify the transaction screenshot provided. Please verify the
                  transferred amount, correct account number, and upload a clear receipt screenshot.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left text-xs space-y-1 text-amber-800 dark:text-amber-300">
                <p className="font-bold">Next Steps:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                  <li>Double-check the company account number.</li>
                  <li>Ensure the receipt shows the correct transfer amount (ETB {service.prepayment_amount}).</li>
                  <li>Click &quot;Re-upload Receipt&quot; below to submit a new screenshot.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer Actions ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 shrink-0">
          {(modalState === "upload" || modalState === "uploading") && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={modalState === "uploading"}
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedFile || modalState === "uploading"}
                onClick={handleSubmitProof}
                className="w-full sm:w-auto rounded-full text-xs font-bold bg-[#0f2937] hover:bg-black text-white cursor-pointer"
              >
                {modalState === "uploading" ? (
                  <span className="flex items-center gap-2">
                    <Icon icon="solar:spinner-linear" className="w-4 h-4 animate-spin" />
                    <span>Uploading Proof...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="solar:cloud-upload-bold" className="w-4 h-4 text-amber-400" />
                    <span>Submit Payment Proof</span>
                  </span>
                )}
              </Button>
            </>
          )}

          {modalState === "verifying" && (
            <div className="w-full flex items-center justify-between text-xs text-slate-500">
              <span>Hold on while we verify your receipt...</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  if (booking) {
                    router.push(`/profile`);
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Check status in profile later
              </Button>
            </div>
          )}

          {modalState === "approved" && (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  if (booking) {
                    router.push(`/booking/confirmation/${booking.id}`);
                  }
                }}
                className="w-full sm:w-1/2 rounded-full text-xs font-medium"
              >
                View Confirmation Page
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    router.push("/profile");
                  }
                }}
                className="w-full sm:w-1/2 rounded-full text-xs font-bold bg-[#0f2937] hover:bg-black text-white cursor-pointer"
              >
                <Icon icon="solar:calendar-mark-bold" className="w-4 h-4 text-amber-400 mr-1.5" />
                View in My Bookings
              </Button>
            </div>
          )}

          {modalState === "rejected" && (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-1/2 rounded-full text-xs"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setModalState("upload");
                }}
                className="w-full sm:w-1/2 rounded-full text-xs font-bold bg-[#0f2937] hover:bg-black text-white cursor-pointer"
              >
                <Icon icon="solar:restart-bold" className="w-4 h-4 text-amber-400 mr-1.5" />
                Re-upload Receipt
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
