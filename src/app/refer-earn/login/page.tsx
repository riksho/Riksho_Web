"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { promoterSupabase } from "@/lib/supabaseAdminClient";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import "@/styles/portal.css";

export default function PromoterLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "code">("input");
  const [phone, setPhone] = useState("");
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      const newOtp = [...otpArray];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtpArray(newOtp);

      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpArray(newOtp);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");
    setError("");

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setInputError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const formattedPhone = cleanPhone.startsWith("91") && cleanPhone.length > 10
      ? `+${cleanPhone}`
      : `+91${cleanPhone.slice(-10)}`;

    setLoading(true);
    try {
      const { error: signInError } = await promoterSupabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (signInError) throw signInError;

      setStep("code");
      setOtpArray(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please verify your phone number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpArray.join("").trim();
    if (cleanCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") && cleanPhone.length > 10
      ? `+${cleanPhone}`
      : `+91${cleanPhone.slice(-10)}`;

    setLoading(true);
    setError("");

    try {
      const { error: verifyError } = await promoterSupabase.auth.verifyOtp({
        phone: formattedPhone,
        token: cleanCode,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      router.push("/refer-earn/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <header className="portal-top-bar">
        <Link href="/" className="portal-top-brand">
          <img src="/images/final_riksho.png" alt="Riksho" className="portal-top-logo" />
          <span className="portal-type-badge">Brand Promoter</span>
        </Link>
        <Link href="/" className="portal-back-btn">
          <ArrowLeft size={16} />
          <span className="back-full-text">Back to Website</span>
          <span className="back-short-text">Back</span>
        </Link>
      </header>

      <div className="admin-login-container">
        <div className="admin-login-card-wrapper">
          <div className="admin-login-card">
            {/* Left Illustration Panel */}
          <div
            className="admin-login-ill"
            style={{
              backgroundImage: "url('/images/login_ill_promoter.png')",
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              backgroundColor: "#EEF2FF",
            }}
          />

          {/* Right Form Area */}
          <div className="admin-login-form-area">
            <div style={{ marginBottom: "24px" }}>
              <h2 className="admin-login-title">Promoter Portal</h2>
              <p className="admin-login-sub">
                Sign in or register as a Riksho Brand Promoter using your mobile number.
              </p>
            </div>

            {error && (
              <div className="admin-error-box" style={{ marginBottom: "20px" }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {step === "input" ? (
              <form onSubmit={handleSendCode} noValidate>
                <div className="admin-field-group">
                  <label className="admin-field-label">Mobile Phone Number</label>
                  <div className="admin-input-wrapper">
                    <div className="admin-phone-prefix">
                      <span>🇮🇳</span> +91
                    </div>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      className="admin-input-enhanced admin-input-phone"
                      style={inputError ? { borderColor: "#EF4444" } : {}}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ""));
                        if (inputError) setInputError("");
                        if (error) setError("");
                      }}
                      maxLength={10}
                      autoFocus
                      required
                    />
                  </div>

                  {inputError && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", color: "#EF4444", fontSize: "13px", fontWeight: 600 }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{inputError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="admin-btn-hero"
                  disabled={loading || phone.trim().length < 10}
                >
                  <span>{loading ? "Sending verification code..." : "Request Promoter OTP"}</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode}>
                <div className="admin-field-group">
                  <label className="admin-field-label">
                    Enter the 6-digit OTP sent to <strong style={{ color: "#0F172A" }}>+91 {phone}</strong>
                  </label>

                  <div className="admin-otp-group" style={{ marginTop: "12px" }}>
                    {otpArray.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        className="admin-otp-box"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        maxLength={6}
                        required={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-btn-hero"
                  disabled={loading || otpArray.join("").length < 6}
                >
                  <span>{loading ? "Verifying Credentials…" : "Authenticate & Open Portal"}</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  style={{
                    width: "100%",
                    height: "46px",
                    background: "transparent",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: "14px",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setStep("input")}
                  disabled={loading}
                >
                  <ArrowLeft size={16} /> Edit Phone Number
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Made in India Outside Card */}
        <div className="portal-outer-made-in-india">
          <span className="proudly-indian">Proudly Made in India</span>
          <svg width="20" height="13.5" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '2px', objectFit: 'cover' }}>
            <rect width="300" height="66.66" fill="#FF9933"/>
            <rect y="66.66" width="300" height="66.66" fill="#FFFFFF"/>
            <rect y="133.33" width="300" height="66.66" fill="#138808"/>
            <circle cx="150" cy="100" r="24" fill="none" stroke="#000080" strokeWidth="4"/>
            <line x1="150" y1="76" x2="150" y2="124" stroke="#000080" strokeWidth="2"/>
            <line x1="126" y1="100" x2="174" y2="100" stroke="#000080" strokeWidth="2"/>
            <line x1="133" y1="83" x2="167" y2="117" stroke="#000080" strokeWidth="2"/>
            <line x1="167" y1="83" x2="133" y2="117" stroke="#000080" strokeWidth="2"/>
          </svg>
        </div>
      </div>
    </div>
    </div>
  );
}
