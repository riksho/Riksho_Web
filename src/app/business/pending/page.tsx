"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { businessSupabase } from "@/lib/supabaseAdminClient";
import {
  Clock,
  ArrowLeft,
  Home,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import "@/styles/portal.css";

interface BusinessInfo {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  gstin: string;
  pan: string;
  status: string;
  created_at: string;
}

export default function BusinessPendingPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);

  const fetchStatus = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const { data: { session } } = await businessSupabase.auth.getSession();
      if (!session) {
        router.push("/business/login");
        return;
      }
      setSessionUser(session.user);

      const { data: biz, error } = await businessSupabase
        .from("businesses")
        .select("id, name, contact_name, phone, email, city, address, gstin, pan, status, created_at")
        .eq("owner_user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching business:", error);
      }

      if (!biz) {
        router.push("/business/register");
        return;
      }

      setBusiness(biz);
    } catch (err) {
      console.error("Pending page check failed:", err);
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-poll status every 15 seconds while waiting
    const interval = setInterval(() => {
      fetchStatus(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    await businessSupabase.auth.signOut();
    router.push("/business/login");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="admin-login-wrapper">
        <header className="portal-top-bar">
          <Link href="/" className="portal-top-brand">
            <img src="/images/final_riksho.png" alt="Riksho" className="portal-top-logo" />
            <span className="portal-type-badge">Enterprise Portal</span>
          </Link>
        </header>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "#64748b", fontWeight: 600 }}>
          <RefreshCw size={20} className="admin-spin" style={{ marginRight: 10 }} />
          Loading your business application status…
        </div>
      </div>
    );
  }

  const isApproved = business?.status === "active" || business?.status === "approved";
  const isRejected = business?.status === "rejected";

  return (
    <div className="admin-login-wrapper" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header className="portal-top-bar">
        <Link href="/" className="portal-top-brand">
          <img src="/images/final_riksho.png" alt="Riksho" className="portal-top-logo" />
          <span className="portal-type-badge">Enterprise Portal</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => fetchStatus(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1.5px solid #e2e8f0",
              background: "#ffffff",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} className={refreshing ? "admin-spin" : ""} />
            {refreshing ? "Checking…" : "Check Status"}
          </button>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1.5px solid #fee2e2",
              background: "#fff5f5",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#dc2626",
              cursor: "pointer",
            }}
          >
            <LogOut size={13} />
            Log Out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "720px", margin: "40px auto 60px", padding: "0 20px" }}>
        {/* If approved, show Celebration Card */}
        {isApproved ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "2px solid #a7f3d0",
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.12)",
              padding: "36px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                border: "2px solid #6ee7b7",
              }}
            >
              <CheckCircle2 size={36} color="#059669" />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#065f46", margin: "0 0 10px" }}>
              🎉 Congratulations! Your Account is Approved
            </h1>
            <p style={{ fontSize: "14.5px", color: "#374151", margin: "0 0 24px", lineHeight: 1.6 }}>
              Your enterprise business account for <strong>{business?.name}</strong> has been officially verified by the Riksho team. A congratulatory confirmation was dispatched to your registered phone and email.
            </p>
            <Link
              href="/business/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#4338CA",
                color: "#ffffff",
                padding: "14px 32px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(67, 56, 202, 0.3)",
              }}
            >
              Launch Enterprise Dashboard →
            </Link>
          </div>
        ) : isRejected ? (
          /* Rejection Alert Card */
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "2px solid #fecaca",
              boxShadow: "0 10px 30px rgba(239, 68, 68, 0.1)",
              padding: "36px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                border: "2px solid #fca5a5",
              }}
            >
              <AlertTriangle size={36} color="#dc2626" />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#991b1b", margin: "0 0 10px" }}>
              Application Needs Revision
            </h1>
            <p style={{ fontSize: "14.5px", color: "#4b5563", margin: "0 0 24px", lineHeight: 1.6 }}>
              Our onboarding team reviewed your submission for <strong>{business?.name}</strong> and was unable to verify the tax documentation or operating address. Please update your details to resubmit.
            </p>
            <Link
              href="/business/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#dc2626",
                color: "#ffffff",
                padding: "13px 28px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              <Edit3 size={16} />
              Edit & Resubmit Application
            </Link>
          </div>
        ) : (
          /* Standard Pending Review Card */
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
              padding: "36px 32px",
            }}
          >
            {/* Top Icon & Header */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#eef2ff",
                  border: "2px solid #c7d2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Clock size={30} color="#4338CA" strokeWidth={2.2} />
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Application Under Verification
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.6, maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
                Your enterprise account registration has been submitted successfully to our compliance admin desk. Verification takes <strong>24–48 hours</strong>.
              </p>
              <div style={{ marginTop: "14px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#fff7ed",
                    border: "1.5px solid #fed7aa",
                    color: "#c2410c",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "999px",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ea580c" }} />
                  Pending Admin Approval
                </span>
              </div>
            </div>

            {/* Submitted Summary Box */}
            {business && (
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "20px 24px",
                  marginBottom: "28px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Submitted Application Summary
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <Building2 size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Enterprise Entity</div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{business.name}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <User size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Contact Representative</div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{business.contact_name || "—"}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <Phone size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Registered Phone</div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginTop: 2 }}>+91 {business.phone || "—"}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <Mail size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Registered Work Email</div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginTop: 2, wordBreak: "break-all" }}>{business.email || "—"}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <FileText size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Tax Document (GSTIN/PAN)</div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginTop: 2, fontFamily: "monospace", letterSpacing: "0.03em" }}>
                        {business.gstin || business.pan || "—"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <MapPin size={16} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Operating Location</div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                        {business.city ? `${business.city}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "16px", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                  <span>Submission Date: <strong>{formatDate(business.created_at)}</strong></span>
                  <span>Reference ID: <strong style={{ fontFamily: "monospace" }}>{business.id.slice(0, 8)}</strong></span>
                </div>
              </div>
            )}

            {/* Bottom Nav / Options */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#334155",
                  textDecoration: "none",
                }}
              >
                <Home size={15} />
                Back to Riksho Home
              </Link>
              <Link
                href="/business"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#334155",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={15} />
                Business Overview
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

