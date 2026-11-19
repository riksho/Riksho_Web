"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import {
  UserMinus,
  Search,
  Phone,
  MessageCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface DusmintLead {
  id: string;
  phone: string;
  stage: "otp_requested" | "otp_verified";
  statusLabel: string;
  firstSeen: string;
  lastActive: string;
  authUserId: string | null;
}

export default function DusmintLeadsPage() {
  const [leads, setLeads] = useState<DusmintLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | "otp_requested" | "otp_verified">("all");

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await adminFetch("/admin/dusmint/leads");
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load DusMint leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = !search.trim() || lead.phone.includes(search.trim());
    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const stage1Count = leads.filter((l) => l.stage === "otp_requested").length;
  const stage2Count = leads.filter((l) => l.stage === "otp_verified").length;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div className="admin-page-header" style={{ marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserMinus size={20} color="#D97706" />
            </div>
            <h1 className="admin-page-title" style={{ fontSize: "24px", fontWeight: "800", color: "var(--admin-ink)" }}>
              DusMint Partner Leads (Drop-offs)
            </h1>
            <span
              style={{
                backgroundColor: "#FEF3C7",
                color: "#B45309",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              Funnel Conversion
            </span>
          </div>
          <p className="admin-page-subtitle" style={{ color: "var(--admin-muted)" }}>
            Potential shop owners who entered their mobile number or verified OTP but haven't finished the onboarding form.
          </p>
        </div>

        <button
          onClick={() => fetchLeads()}
          disabled={loading}
          style={{
            padding: "9px 16px",
            backgroundColor: "#F3F4F6",
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--admin-ink)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <RefreshCw size={14} className={loading ? "admin-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Conversion Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "22px" }}>
        <div
          className="admin-card"
          style={{
            padding: "18px 22px",
            backgroundColor: "white",
            borderRadius: "14px",
            border: "1px solid var(--admin-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#B45309", textTransform: "uppercase" }}>
              Stage 1: OTP Requested
            </span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--admin-ink)", marginTop: "4px" }}>
              {stage1Count}
            </div>
            <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>Entered number, didn't verify OTP</span>
          </div>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={20} color="#D97706" />
          </div>
        </div>

        <div
          className="admin-card"
          style={{
            padding: "18px 22px",
            backgroundColor: "white",
            borderRadius: "14px",
            border: "1px solid var(--admin-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#047A36", textTransform: "uppercase" }}>
              Stage 2: OTP Verified (High Intent)
            </span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--admin-ink)", marginTop: "4px" }}>
              {stage2Count}
            </div>
            <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>Verified OTP, dropped off at 4-step form</span>
          </div>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#E8F5EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={20} color="#047A36" />
          </div>
        </div>

        <div
          className="admin-card"
          style={{
            padding: "18px 22px",
            backgroundColor: "#F0FDF4",
            borderRadius: "14px",
            border: "1px solid #BBF7D0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <TrendingUp size={16} color="#047A36" />
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#047A36" }}>Re-engage with Push / WhatsApp</span>
          </div>
          <span style={{ fontSize: "12px", color: "#166534", lineHeight: "1.4" }}>
            Broadcast custom onboarding incentives directly from Push Notifications admin.
          </span>
          <Link
            href="/admin/push"
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#047A36",
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
            }}
          >
            Send DusMint Broadcast <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="admin-card"
        style={{
          padding: "16px 20px",
          backgroundColor: "white",
          borderRadius: "14px",
          border: "1px solid var(--admin-border)",
          marginBottom: "20px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search
            size={16}
            color="#9CA3AF"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Filter by phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "8px",
              border: "1px solid var(--admin-border)",
              fontSize: "13px",
              backgroundColor: "#F9FAFB",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>Stage:</span>
          {[
            { key: "all", label: "All Leads" },
            { key: "otp_requested", label: "OTP Requested" },
            { key: "otp_verified", label: "OTP Verified" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStageFilter(item.key as any)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                border: stageFilter === item.key ? "1px solid #047A36" : "1px solid var(--admin-border)",
                backgroundColor: stageFilter === item.key ? "#E8F5EC" : "white",
                color: stageFilter === item.key ? "#047A36" : "var(--admin-muted)",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div
        className="admin-card"
        style={{
          padding: 0,
          backgroundColor: "white",
          borderRadius: "16px",
          border: "1px solid var(--admin-border)",
          overflow: "hidden",
        }}
      >
        <div className="admin-table-container">
          <div className="admin-table-scroll">
            <table className="admin-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB" }}>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    MOBILE NUMBER
                  </th>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    FUNNEL STAGE
                  </th>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    FIRST SEEN
                  </th>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    LAST ACTIVE
                  </th>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    CONVERSION OUTREACH
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
                      Loading partner leads...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "64px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
                      <CheckCircle size={36} color="#16A34A" style={{ margin: "0 auto 12px" }} />
                      <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--admin-ink)", marginBottom: "4px" }}>
                        No drop-off leads found
                      </div>
                      <div style={{ fontSize: "13px" }}>
                        All users who started onboarding have either finished or there are no drop-offs currently.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const cleanPhone = (lead.phone || "").replace(/\D/g, "");
                    const waMessage = encodeURIComponent(
                      lead.stage === "otp_verified"
                        ? "Namaste! We noticed you verified your number on DusMint Partner app. Complete your shop details in just 2 minutes to start receiving daily mandi orders directly to your shop!"
                        : "Namaste! We saw you requested an OTP on DusMint Partner app. Need any help getting started with selling fresh veggies and fruits?"
                    );

                    return (
                      <tr key={lead.id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--admin-ink)" }}>
                            {lead.phone}
                          </span>
                        </td>

                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          {lead.stage === "otp_verified" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: "#FEF3C7",
                                color: "#B45309",
                                border: "1px solid #FDE68A",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                              }}
                            >
                              <CheckCircle size={13} color="#D97706" /> OTP Verified (Pending Form)
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: "#F3F4F6",
                                color: "#4B5563",
                                border: "1px solid #E5E7EB",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                              }}
                            >
                              <Clock size={13} color="#6B7280" /> OTP Requested (Unverified)
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "16px 20px", verticalAlign: "middle", fontSize: "13px", color: "var(--admin-muted)" }}>
                          {new Date(lead.firstSeen).toLocaleDateString([], { month: "short", day: "numeric" })}
                          <div style={{ fontSize: "11px", color: "var(--admin-muted-soft)" }}>
                            {new Date(lead.firstSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>

                        <td style={{ padding: "16px 20px", verticalAlign: "middle", fontSize: "13px", color: "var(--admin-muted)" }}>
                          {new Date(lead.lastActive).toLocaleDateString([], { month: "short", day: "numeric" })}
                          <div style={{ fontSize: "11px", color: "var(--admin-muted-soft)" }}>
                            {new Date(lead.lastActive).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>

                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <a
                              href={`tel:${lead.phone}`}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                backgroundColor: "#EFF6FF",
                                border: "1px solid #BFDBFE",
                                color: "#2563EB",
                                fontSize: "12px",
                                fontWeight: "600",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Phone size={12} /> Call
                            </a>

                            <a
                              href={`https://wa.me/${cleanPhone}?text=${waMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                backgroundColor: "#DCFCE7",
                                border: "1px solid #BBF7D0",
                                color: "#16A34A",
                                fontSize: "12px",
                                fontWeight: "700",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <MessageCircle size={13} /> WhatsApp
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
