"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { businessSupabase } from "@/lib/supabaseAdminClient";
import { Clock, ArrowLeft, Home } from "lucide-react";
import "@/styles/portal.css";

interface BusinessInfo {
  name: string;
  city: string;
  gstin: string;
  status: string;
  created_at: string;
}

export default function BusinessPendingPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { session } } = await businessSupabase.auth.getSession();
        if (!session) {
          router.push("/business/login");
          return;
        }

        const { data: biz } = await businessSupabase
          .from("businesses")
          .select("name, city, gstin, status, created_at")
          .eq("owner_user_id", session.user.id)
          .maybeSingle();

        if (!biz) {
          router.push("/business/register");
          return;
        }

        // If already approved, redirect to dashboard
        if (biz.status === "active" || biz.status === "approved") {
          router.push("/business/dashboard");
          return;
        }

        setBusiness(biz);
      } catch (err) {
        console.error("Pending page check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="pending-page-wrapper">
        <div style={{ color: "#64748b", fontSize: "14px", fontWeight: 600 }}>
          Loading…
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
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

      <div className="pending-page-wrapper">
        <div className="pending-card">
          {/* Icon */}
          <div className="pending-icon-ring">
            <Clock size={34} color="#4338CA" strokeWidth={2.2} />
          </div>

          {/* Title */}
          <h1 className="pending-title">Application Under Review</h1>
          <p className="pending-subtitle">
            Your enterprise account registration has been submitted successfully. 
            Our team will review and verify your business details within 24–48 hours.
          </p>

          {/* Business Details Summary */}
          {business && (
            <div className="pending-details">
              <div className="pending-detail-row">
                <span className="pending-detail-label">Business</span>
                <span className="pending-detail-value">{business.name}</span>
              </div>
              <div className="pending-detail-row">
                <span className="pending-detail-label">City</span>
                <span className="pending-detail-value">{business.city || "—"}</span>
              </div>
              <div className="pending-detail-row">
                <span className="pending-detail-label">GSTIN / PAN</span>
                <span className="pending-detail-value" style={{ fontFamily: "monospace", letterSpacing: "0.04em" }}>
                  {business.gstin || "—"}
                </span>
              </div>
              <div className="pending-detail-row">
                <span className="pending-detail-label">Submitted</span>
                <span className="pending-detail-value">{formatDate(business.created_at)}</span>
              </div>
              <div className="pending-detail-row">
                <span className="pending-detail-label">Status</span>
                <span className="pending-status-chip">
                  <span className="pending-status-dot" />
                  Pending Review
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pending-actions">
            <Link href="/" className="pending-btn-home">
              <Home size={16} />
              <span>Back to Riksho Home</span>
            </Link>
            <Link href="/business" className="pending-btn-secondary">
              <ArrowLeft size={14} />
              <span>Business Landing Page</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
