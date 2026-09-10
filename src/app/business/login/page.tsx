"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { businessSupabase } from "@/lib/supabaseAdminClient";
import { AlertCircle, ArrowLeft, ArrowRight, Mail, Phone, Building2, X } from "lucide-react";
import "@/styles/portal.css";
import Link from "next/link";

export default function BusinessLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "code">("input");
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [loginId, setLoginId] = useState("");
  const [code, setCode] = useState("");
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");
  const [showNotRegisteredModal, setShowNotRegisteredModal] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split('');
      const newOtp = [...otpArray];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
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
      setInputError(tab === "email" ? "Please enter your registered work email." : "Please enter your mobile phone number.");
      return;
    }

    if (tab === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(id)) {
        setInputError("Please enter a valid work email address (e.g. name@company.com)");
        return;
      }
    } else {
      if (id.length !== 10 || !/^[6-9]\d{9}$/.test(id)) {
        setInputError("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9");
        return;
      }
    }

    setLoading(true);

    // 1. Check if this business email/phone is registered in the database
    try {
      const { data: isRegistered } = await businessSupabase.rpc("is_business_registered", {
        lookup_value: id,
      });

      if (isRegistered === false) {
        setLoading(false);
        setShowNotRegisteredModal(true);
        return;
      }
    } catch (e) {
      console.warn("Registration check bypassed:", e);
    }
    
    let signInError;
    if (tab === "email") {
      const res = await businessSupabase.auth.signInWithOtp({
        email: id.toLowerCase(),
        options: { shouldCreateUser: false },
      });
      signInError = res.error;
    } else {
      const formattedPhone = id.startsWith("+") ? id : `+91${id.replace(/^0+/, '')}`;
      const res = await businessSupabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { shouldCreateUser: false },
      });
      signInError = res.error;
    }

    setLoading(false);

    if (signInError) {
      const msg = signInError.message?.toLowerCase() || "";
      if (
        msg.includes("signups not allowed") ||
        msg.includes("user not found") ||
        msg.includes("invalid") ||
        signInError.status === 400 ||
        signInError.status === 422
      ) {
        setShowNotRegisteredModal(true);
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

    const id = loginId.trim();
    let verifyError;
    let authData;
    if (tab === "email") {
      const res = await businessSupabase.auth.verifyOtp({
        email: id.toLowerCase(),
        token: code,
        type: "email",
      });
      verifyError = res.error;
      authData = res.data;
    } else {
      const formattedPhone = id.startsWith("+") ? id : `+91${id.replace(/^0+/, '')}`;
      const res = await businessSupabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: "sms",
      });
      verifyError = res.error;
      authData = res.data;
    }

    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    // Check if user has an active business registered in the database
    const userId = authData?.user?.id;
    if (userId) {
      const { data: biz } = await businessSupabase
        .from("businesses")
        .select("id, status, name")
        .eq("owner_user_id", userId)
        .maybeSingle();

      if (!biz) {
        // User verified OTP, but has NOT registered their business yet!
        const param = tab === "email" ? `email=${encodeURIComponent(id)}` : `phone=${encodeURIComponent(id)}`;
        setLoading(false);
        router.push(`/business/register?${param}`);
        return;
      }

      // If business registration is under review or rejected, route to pending page
      if (biz.status === "pending" || biz.status === "rejected") {
        setLoading(false);
        router.push("/business/pending");
        return;
      }
    }

    setLoading(false);
    router.push("/business/dashboard");
  };

  return (
    <div className="admin-login-wrapper">
      <header className="portal-top-bar">
        <Link href="/" className="portal-top-brand">
          <img src="/images/final_riksho.png" alt="Riksho" className="portal-top-logo" />
          <span className="portal-type-badge">Enterprise Portal</span>
        </Link>
        <Link href="/business" className="portal-back-btn">
          <ArrowLeft size={16} />
          <span className="back-full-text">Back to Business</span>
          <span className="back-short-text">Back</span>
        </Link>
      </header>

      <div className="admin-login-container">
        <div className="admin-login-card-wrapper">
          <div className="admin-login-card">
            {/* Left Illustration Panel */}
          <div 
            className="admin-login-ill" 
            style={{ backgroundImage: "url('/images/login_ill_business.png')" }}
          />

          {/* Right Form Area */}
          <div className="admin-login-form-area">
            <div style={{ marginBottom: "24px" }}>
              <h2 className="admin-login-title">Business Portal</h2>
              <p className="admin-login-sub">
                Sign in with your registered phone or work email to manage your enterprise fleet.
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
                {/* Segmented Tab Switcher */}
                <div className="admin-login-segmented">
                  <div 
                    className={`admin-login-segment ${tab === 'phone' ? 'active' : ''}`}
                    onClick={() => { setTab('phone'); setLoginId(""); setInputError(""); setError(""); }}
                  >
                    <Phone size={16} /> Mobile Phone
                  </div>
                  <div 
                    className={`admin-login-segment ${tab === 'email' ? 'active' : ''}`}
                    onClick={() => { setTab('email'); setLoginId(""); setInputError(""); setError(""); }}
                  >
                    <Mail size={16} /> Work Email
                  </div>
                </div>

                <div className="admin-field-group">
                  <label className="admin-field-label">
                    {tab === "email" ? "Registered Work Email" : "Mobile Phone Number"}
                  </label>
                  
                  <div className="admin-input-wrapper">
                    {tab === "email" ? (
                      <>
                        <div className="admin-input-icon">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          placeholder="name@company.com"
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
                      </>
                    ) : (
                      <>
                        <div className="admin-phone-prefix" style={inputError ? { borderRightColor: "#EF4444" } : {}}>
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          className="admin-input-enhanced admin-input-phone"
                          style={inputError ? { borderColor: "#EF4444" } : {}}
                          value={loginId}
                          maxLength={10}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setLoginId(cleaned);
                            if (inputError) setInputError("");
                            if (error) setError("");
                          }}
                          autoFocus
                        />
                      </>
                    )}
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
                  <span>{loading ? "Sending verification code..." : "Request Access OTP"}</span>
                  <ArrowRight size={18} />
                </button>
                
                <div className="admin-auth-switch">
                  Don't have an enterprise account? 
                  <Link href="/business/register">Register now</Link>
                </div>
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
                  <span>{loading ? "Verifying Credentials…" : "Authenticate & Sign In"}</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  style={{
                    width: "100%",
                    height: "46px",
                    background: "transparent",
                    border: "1.5px solid #0F172A",
                    borderRadius: "14px",
                    color: "#0F172A",
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
                  <ArrowLeft size={16} /> Edit {tab === 'email' ? 'Email' : 'Phone'}
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

      {/* ---------- Not Registered Modal Dialog ---------- */}
      {showNotRegisteredModal && (
        <div className="portal-modal-backdrop" onClick={() => setShowNotRegisteredModal(false)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="portal-modal-close" onClick={() => setShowNotRegisteredModal(false)}>
              <X size={16} />
            </button>

            <div className="portal-modal-icon-badge">
              <Building2 size={24} />
            </div>

            <span className="portal-modal-tag">New to Riksho Enterprise?</span>
            <h3 className="portal-modal-title">No Account Found for This {tab === 'email' ? 'Email' : 'Number'}</h3>
            
            <p className="portal-modal-desc">
              We couldn't find an active enterprise account associated with <strong style={{ color: "#0F172A" }}>{loginId}</strong>. If your business is new to Riksho, you can get onboarded in less than 2 minutes.
            </p>

            <div className="portal-modal-actions">
              <button 
                className="admin-btn-hero"
                onClick={() => {
                  const param = tab === 'email' 
                    ? `email=${encodeURIComponent(loginId.trim())}` 
                    : `phone=${encodeURIComponent(loginId.trim())}`;
                  router.push(`/business/register?${param}`);
                }}
              >
                <span>Create Enterprise Account</span>
                <ArrowRight size={18} />
              </button>

              <button 
                className="portal-modal-btn-secondary"
                onClick={() => setShowNotRegisteredModal(false)}
              >
                Try a Different {tab === 'email' ? 'Email' : 'Phone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
