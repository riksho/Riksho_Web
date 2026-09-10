"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { AlertCircle, ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import "@/styles/portal.css";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "code">("input");
  const [loginId, setLoginId] = useState("");
  const [code, setCode] = useState("");
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split('');
      const newOtp = [...otpArray];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtpArray(newOtp);
      setCode(newOtp.join(''));
      
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpArray(newOtp);
    setCode(newOtp.join(''));

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");
    setError("");

    const id = loginId.trim();
    if (!id) {
      setInputError("Please enter your administrator email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(id)) {
      setInputError("Please enter a valid administrator email address (e.g. admin@riksho.com)");
      return;
    }

    setLoading(true);
    
    const { error: signInError } = await supabaseAdminClient.auth.signInWithOtp({
      email: id.toLowerCase(),
      options: { shouldCreateUser: false },
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.includes("Signups not allowed")) {
         setError("This email is not authorized as an administrator.");
      } else {
         setError(signInError.message);
      }
      return;
    }

    setStep("code");
    setOtpArray(["", "", "", "", "", ""]);
    setCode("");
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setLoading(true);
    setError("");

    const { error: verifyError } = await supabaseAdminClient.auth.verifyOtp({
      email: loginId.trim().toLowerCase(),
      token: code,
      type: "email",
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="admin-login-wrapper">
      <header className="portal-top-bar">
        <Link href="/" className="portal-top-brand">
          <img src="/images/final_riksho.png" alt="Riksho" className="portal-top-logo" />
          <span className="portal-type-badge">Admin Control</span>
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
            style={{ backgroundImage: "url('/images/login_ill_admin.png')" }}
          />

          {/* Right Form Area */}
          <div className="admin-login-form-area">
            <div style={{ marginBottom: "24px" }}>
              <h2 className="admin-login-title">Admin Console</h2>
              <p className="admin-login-sub">
                Sign in with your authorized administrator email address to access controls.
              </p>
            </div>

            {error && (
              <div className="admin-error-box">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {step === "input" ? (
              <form onSubmit={handleSendCode} noValidate>
                <div className="admin-field-group">
                  <label className="admin-field-label">
                    Administrator Email Address
                  </label>
                  
                  <div className="admin-input-wrapper">
                    <div className="admin-input-icon">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      placeholder="admin@riksho.com"
                      className="admin-input-enhanced"
                      style={inputError ? { borderColor: "#EF4444" } : {}}
                      value={loginId}
                      onChange={(e) => {
                        setLoginId(e.target.value);
                        if (inputError) setInputError("");
                        if (error) setError("");
                      }}
                      autoFocus
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
                  disabled={loading}
                >
                  <span>{loading ? "Sending verification code..." : "Request Admin OTP"}</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode}>
                <div className="admin-field-group">
                  <label className="admin-field-label">
                    Enter the 6-digit OTP sent to <strong style={{ color: "#0F172A" }}>{loginId}</strong>
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
                  disabled={loading}
                >
                  <span>{loading ? "Verifying Credentials…" : "Authenticate & Open Console"}</span>
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
                    transition: "all 0.15s ease"
                  }}
                  onClick={() => setStep("input")}
                  disabled={loading}
                >
                  <ArrowLeft size={16} /> Edit Email Address
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
