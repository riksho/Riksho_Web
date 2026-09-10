"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import "@/styles/portal.css";

interface Business {
  id: string;
  name: string;
  gstin: string;
  pan: string;
  city: string;
  address: string;
  contact_name: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
  owner_user_id: string;
}

type FilterTab = "pending" | "active" | "rejected" | "all";

export default function BusinessApprovalsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({ pending: 0, active: 0, rejected: 0, all: 0 });

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      let query = supabaseAdminClient
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error("Failed to load businesses:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      const { data, error } = await supabaseAdminClient
        .from("businesses")
        .select("status");
      if (!error && data) {
        const p = data.filter((b) => b.status === "pending").length;
        const a = data.filter((b) => b.status === "active").length;
        const r = data.filter((b) => b.status === "rejected").length;
        setCounts({ pending: p, active: a, rejected: r, all: data.length });
      }
    } catch {}
  };

  useEffect(() => {
    loadBusinesses();
    loadCounts();
  }, [filter]);

  const handleAction = async (businessId: string, newStatus: "active" | "rejected") => {
    setActionLoading(businessId);
    try {
      const { error } = await supabaseAdminClient
        .from("businesses")
        .update({ status: newStatus })
        .eq("id", businessId);

      if (error) throw error;

      // Update local state
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessId ? { ...b, status: newStatus } : b))
      );
      loadCounts();
    } catch (err) {
      console.error("Failed to update business status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setActionLoading(null);
    }
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

  const filtered = businesses.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.gstin?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q) ||
      b.contact_name?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.phone?.includes(q)
    );
  });

  const filterTabs: { key: FilterTab; label: string; color: string }[] = [
    { key: "pending", label: "Pending", color: "#F59E0B" },
    { key: "active", label: "Approved", color: "#10B981" },
    { key: "rejected", label: "Rejected", color: "#EF4444" },
    { key: "all", label: "All", color: "#64748B" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div>
          <h1 className="admin-page-title">Business Approvals</h1>
          <p className="admin-page-subtitle">Review and manage enterprise account registrations.</p>
        </div>
        <button
          onClick={() => { loadBusinesses(); loadCounts(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "10px",
            border: "1.5px solid #e2e8f0",
            background: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            color: "#475569",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "10px",
              border: filter === tab.key ? `1.5px solid ${tab.color}` : "1.5px solid #e2e8f0",
              background: filter === tab.key ? `${tab.color}10` : "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              color: filter === tab.key ? tab.color : "#64748b",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
            <span
              style={{
                background: filter === tab.key ? tab.color : "#e2e8f0",
                color: filter === tab.key ? "#ffffff" : "#64748b",
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "999px",
                minWidth: "22px",
                textAlign: "center",
              }}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "20px", maxWidth: "400px" }}>
        <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input
          type="text"
          placeholder="Search by name, GSTIN, city, email…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            height: "42px",
            paddingLeft: "40px",
            paddingRight: "16px",
            borderRadius: "10px",
            border: "1.5px solid #e2e8f0",
            fontSize: "13px",
            outline: "none",
            background: "#f8fafc",
          }}
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="admin-loading-center" style={{ padding: "60px 0" }}>
          <Loader2 size={18} className="admin-spin" />
          Loading businesses…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <Building2 size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: "15px", fontWeight: 600 }}>
            {searchQuery ? "No businesses match your search." : `No ${filter === "all" ? "" : filter} businesses found.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((biz) => (
            <div
              key={biz.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "20px 24px",
                transition: "box-shadow 0.15s ease",
              }}
            >
              {/* Header Row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>{biz.name}</h3>
                    <StatusChip status={biz.status} />
                  </div>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: 500 }}>
                    Submitted {formatDate(biz.created_at)}
                  </p>
                </div>

                {/* Action Buttons */}
                {biz.status === "pending" && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleAction(biz.id, "active")}
                      disabled={actionLoading === biz.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#10B981",
                        color: "#ffffff",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: actionLoading === biz.id ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === biz.id ? (
                        <Loader2 size={13} className="admin-spin" />
                      ) : (
                        <CheckCircle size={13} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(biz.id, "rejected")}
                      disabled={actionLoading === biz.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #fecaca",
                        background: "#ffffff",
                        color: "#DC2626",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: actionLoading === biz.id ? 0.6 : 1,
                      }}
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                  </div>
                )}

                {biz.status === "rejected" && (
                  <button
                    onClick={() => handleAction(biz.id, "active")}
                    disabled={actionLoading === biz.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      border: "1.5px solid #d1fae5",
                      background: "#ffffff",
                      color: "#059669",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle size={13} />
                    Re-approve
                  </button>
                )}
              </div>

              {/* Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <DetailCell icon={<FileText size={13} color="#94a3b8" />} label="GSTIN" value={biz.gstin || "—"} mono />
                <DetailCell icon={<MapPin size={13} color="#94a3b8" />} label="City" value={biz.city || "—"} />
                <DetailCell icon={<Phone size={13} color="#94a3b8" />} label="Phone" value={biz.phone || "—"} />
                <DetailCell icon={<Mail size={13} color="#94a3b8" />} label="Email" value={biz.email || "—"} />
                <DetailCell icon={<Building2 size={13} color="#94a3b8" />} label="Contact" value={biz.contact_name || "—"} />
                <DetailCell icon={<FileText size={13} color="#94a3b8" />} label="PAN" value={biz.pan || "—"} mono />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const config: Record<string, { bg: string; border: string; color: string; dot: string; label: string }> = {
    pending: { bg: "#FFF7ED", border: "#FED7AA", color: "#C2410C", dot: "#F97316", label: "Pending" },
    active: { bg: "#ECFDF5", border: "#A7F3D0", color: "#047857", dot: "#10B981", label: "Approved" },
    rejected: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", dot: "#EF4444", label: "Rejected" },
  };

  const c = config[status] || config.pending;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "999px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        fontSize: "11px",
        fontWeight: 700,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {c.label}
    </span>
  );
}

function DetailCell({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
      <div style={{ marginTop: "2px", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#0f172a",
            marginTop: "2px",
            wordBreak: "break-all",
            ...(mono ? { fontFamily: "monospace", letterSpacing: "0.03em" } : {}),
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
