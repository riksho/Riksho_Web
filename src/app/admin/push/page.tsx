"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import {
  Bell,
  Send,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  X,
  Users,
  Smartphone,
  ShieldAlert,
} from "lucide-react";

interface PushHistoryItem {
  id: string;
  title: string;
  body: string;
  target: string;
  image_url: string | null;
  sent_at: string;
  fcm_message_id: string | null;
}

const ITEMS_PER_PAGE = 8;

export default function PushNotificationsPage() {
  const [history, setHistory] = useState<PushHistoryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [target, setTarget] = useState<
    "all_users" | "riders" | "drivers" | "dusmint_all" | "dusmint_partners" | "dusmint_customers" | "dusmint_leads"
  >("all_users");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"send" | "clear_history" | "test">("send");
  const [pendingPayload, setPendingPayload] = useState<{
    title: string;
    body: string;
    imageUrl?: string;
    target: "all_users" | "riders" | "drivers" | "dusmint_all" | "dusmint_partners" | "dusmint_customers" | "dusmint_leads";
  } | null>(null);

  const fetchHistory = async (page = currentPage) => {
    try {
      setLoading(true);
      const data = await adminFetch(`/admin/push/history?page=${page}&limit=${ITEMS_PER_PAGE}`);
      if (data && Array.isArray(data.items)) {
        setHistory(data.items.slice(0, ITEMS_PER_PAGE));
        setTotalItems(data.total || 0);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
        setCurrentPage(data.page ?? page);
      } else if (Array.isArray(data)) {
        // Fallback: client-side pagination if backend returned raw array
        const start = page * ITEMS_PER_PAGE;
        const sliced = data.slice(start, start + ITEMS_PER_PAGE);
        setHistory(sliced);
        setTotalItems(data.length);
        setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE) || 1);
        setCurrentPage(page);
      }
    } catch (err: any) {
      console.error("Failed to fetch push history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(0);
  }, []);

  const openSendConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Title and Body are required.");
      return;
    }

    setPendingPayload({
      title: title.trim(),
      body: body.trim(),
      imageUrl: imageUrl.trim() || undefined,
      target,
    });
    setModalType("send");
    setModalOpen(true);
  };

  const openQuickTestModal = (
    quickTarget: "all_users" | "riders" | "drivers" | "dusmint_all" | "dusmint_partners" | "dusmint_customers" | "dusmint_leads"
  ) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const targetLabelMap: Record<string, string> = {
      all_users: "All Riksho Users",
      riders: "Riksho Riders",
      drivers: "Riksho Drivers",
      dusmint_all: "DusMint All",
      dusmint_partners: "DusMint Partners",
      dusmint_customers: "DusMint Customers",
      dusmint_leads: "DusMint Leads",
    };
    const targetLabel = targetLabelMap[quickTarget] || quickTarget;

    setPendingPayload({
      title: `🧪 ${quickTarget.startsWith("dusmint") ? "DusMint" : "Riksho"} Test Alert (${targetLabel})`,
      body: `Test broadcast dispatched to ${targetLabel.toLowerCase()} at ${timestamp}. Push pipeline is active!`,
      imageUrl: undefined,
      target: quickTarget,
    });
    setModalType("test");
    setModalOpen(true);
  };

  const openClearHistoryModal = () => {
    setModalType("clear_history");
    setModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (modalType === "clear_history") {
      setActionLoading(true);
      setError("");
      setSuccess("");

      try {
        try {
          await adminFetch("/admin/push/history", { method: "DELETE" });
        } catch (apiErr: any) {
          // Direct fallback if Render is still deploying the backend route
          const { error: sbError } = await supabaseAdminClient
            .from("push_history")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          if (sbError) throw sbError;
        }
        setSuccess("Broadcast history cleared successfully!");
        setModalOpen(false);
        fetchHistory(0);
        setTimeout(() => setSuccess(""), 4000);
      } catch (err: any) {
        setError(err.message || "Failed to clear history");
      } finally {
        setActionLoading(false);
      }
      return;
    }

    if (!pendingPayload) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await adminFetch("/admin/push/send", {
        method: "POST",
        body: JSON.stringify(pendingPayload),
      });

      setSuccess(`Notification sent to ${pendingPayload.target === "all_users" ? "All Users" : pendingPayload.target}!`);
      setModalOpen(false);
      
      if (modalType === "send") {
        setTitle("");
        setBody("");
        setImageUrl("");
      }
      
      fetchHistory(0);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to send notification");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      fetchHistory(newPage);
    }
  };

  const getTargetBadge = (targetStr: string) => {
    switch (targetStr) {
      case "drivers":
        return { label: "Drivers Only", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" };
      case "riders":
        return { label: "Riders Only", bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" };
      case "dusmint_partners":
        return { label: "DusMint Partners", bg: "#E8F5EC", color: "#047A36", border: "#BBF7D0" };
      case "dusmint_customers":
        return { label: "DusMint Customers", bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC" };
      case "dusmint_leads":
        return { label: "DusMint Leads (Drop-offs)", bg: "#FEF3C7", color: "#B45309", border: "#FDE68A" };
      case "dusmint_all":
        return { label: "DusMint (All)", bg: "#ECFDF5", color: "#065F46", border: "#6EE7B7" };
      default:
        return { label: "All Users", bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" };
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div className="admin-page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="admin-page-title" style={{ fontSize: "24px", fontWeight: "800", color: "var(--admin-ink)" }}>
            Push Notifications
          </h1>
          <p className="admin-page-subtitle" style={{ color: "var(--admin-muted)", marginTop: "4px" }}>
            Send real-time alerts, promos, and system broadcasts to riders and drivers.
          </p>
        </div>

        {/* Quick Test Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--admin-muted-soft)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Quick Test:
          </span>
          <button
            onClick={() => openQuickTestModal("riders")}
            style={{
              padding: "8px 14px",
              backgroundColor: "#EEF2FF",
              color: "#4338CA",
              border: "1px solid #C7D2FE",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <FlaskConical size={14} /> Test Riders
          </button>

          <button
            onClick={() => openQuickTestModal("drivers")}
            style={{
              padding: "8px 14px",
              backgroundColor: "#ECFDF5",
              color: "#059669",
              border: "1px solid #A7F3D0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <FlaskConical size={14} /> Test Drivers
          </button>

          <button
            onClick={() => openQuickTestModal("all_users")}
            style={{
              padding: "8px 14px",
              backgroundColor: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid #DDD6FE",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <FlaskConical size={14} /> Test Both
          </button>

          <button
            onClick={() => openQuickTestModal("dusmint_partners")}
            style={{
              padding: "8px 14px",
              backgroundColor: "#E8F5EC",
              color: "#047A36",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <FlaskConical size={14} /> Test DusMint Partner
          </button>

          <button
            onClick={() => openQuickTestModal("dusmint_customers")}
            style={{
              padding: "8px 14px",
              backgroundColor: "#F0FDF4",
              color: "#16A34A",
              border: "1px solid #86EFAC",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <FlaskConical size={14} /> Test DusMint Customer
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            padding: "14px 18px",
            borderRadius: "12px",
            marginBottom: "20px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "1px solid #FECACA",
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#F0FDF4",
            color: "#16A34A",
            padding: "14px 18px",
            borderRadius: "12px",
            marginBottom: "20px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "1px solid #BBF7D0",
          }}
        >
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {/* Main Grid: Form + History */}
      <div className="admin-two-column-grid">
        {/* Compose Form */}
        <div className="admin-card" style={{ padding: "26px", backgroundColor: "white", borderRadius: "16px", border: "1px solid var(--admin-border)", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "22px", display: "flex", alignItems: "center", gap: "10px", color: "var(--admin-ink)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={16} color="#4338CA" />
            </div>
            Compose Notification
          </h2>

          <form onSubmit={openSendConfirmation} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "var(--admin-ink)" }}>
                Target Audience
              </label>
              <select
                className="admin-input"
                value={target}
                onChange={(e: any) => setTarget(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--admin-border)",
                  fontSize: "14px",
                  backgroundColor: "#FAFAFA",
                  color: "var(--admin-ink)",
                  fontWeight: "500",
                }}
              >
                <optgroup label="Riksho Mobility">
                  <option value="all_users">All Riksho Users (Riders + Drivers)</option>
                  <option value="riders">Riksho Riders Only (Customer App)</option>
                  <option value="drivers">Riksho Drivers Only (Riksho Buddy)</option>
                </optgroup>
                <optgroup label="DusMint Quick Commerce">
                  <option value="dusmint_all">DusMint (All Customers & Partners)</option>
                  <option value="dusmint_partners">DusMint Active Partners / Vendors</option>
                  <option value="dusmint_customers">DusMint Customers Only</option>
                  <option value="dusmint_leads">DusMint Partner Leads (Drop-offs / Funnel)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--admin-ink)" }}>
                  Notification Title *
                </label>
                <span style={{ fontSize: "11px", color: "var(--admin-muted-soft)" }}>{title.length}/50</span>
              </div>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., 50% Off On Your Next Ride!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--admin-border)",
                  fontSize: "14px",
                  backgroundColor: "#FAFAFA",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--admin-ink)" }}>
                  Message Body *
                </label>
                <span style={{ fontSize: "11px", color: "var(--admin-muted-soft)" }}>{body.length}/200</span>
              </div>
              <textarea
                className="admin-input"
                placeholder="Enter the alert message that will appear on the notification bar..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={200}
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--admin-border)",
                  fontSize: "14px",
                  backgroundColor: "#FAFAFA",
                  resize: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "var(--admin-ink)" }}>
                <ImageIcon size={14} color="var(--admin-muted)" /> Image URL (Optional)
              </label>
              <input
                type="url"
                className="admin-input"
                placeholder="https://example.com/promo-banner.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--admin-border)",
                  fontSize: "14px",
                  backgroundColor: "#FAFAFA",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim() || !body.trim()}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#4338CA",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: !title.trim() || !body.trim() ? "not-allowed" : "pointer",
                opacity: !title.trim() || !body.trim() ? 0.6 : 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginTop: "6px",
                boxShadow: "0 4px 12px rgba(67, 56, 202, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              <Send size={16} /> Broadcast Notification
            </button>
          </form>
        </div>

        {/* History List */}
        <div
          className="admin-card"
          style={{
            padding: "0",
            backgroundColor: "white",
            borderRadius: "16px",
            border: "1px solid var(--admin-border)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          {/* History Header & Clear Action */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--admin-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: "var(--admin-ink)" }}>
                <Bell size={18} color="#4338CA" /> Broadcast History
              </h2>
              <span style={{ fontSize: "12px", color: "var(--admin-muted)", marginTop: "2px", display: "block" }}>
                {totalItems > 0 ? `Showing ${currentPage * ITEMS_PER_PAGE + 1}–${Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalItems)} of ${totalItems} broadcasts` : "0 broadcasts sent"}
              </span>
            </div>

            {history.length > 0 && (
              <button
                onClick={openClearHistoryModal}
                style={{
                  padding: "7px 12px",
                  backgroundColor: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <Trash2 size={13} /> Clear History
              </button>
            )}
          </div>

          {/* Table */}
          <div className="admin-table-container" style={{ minHeight: "380px" }}>
            <div className="admin-table-scroll">
              <table className="admin-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB" }}>
                    <th style={{ padding: "12px 20px", borderBottom: "1px solid var(--admin-border)", color: "var(--admin-muted-soft)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", width: "160px" }}>
                      Date & Time
                    </th>
                    <th style={{ padding: "12px 20px", borderBottom: "1px solid var(--admin-border)", color: "var(--admin-muted-soft)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", width: "130px" }}>
                      Target
                    </th>
                    <th style={{ padding: "12px 20px", borderBottom: "1px solid var(--admin-border)", color: "var(--admin-muted-soft)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>
                      Message Content
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "48px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
                        Loading broadcast history...
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "64px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
                        <Smartphone size={32} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
                        <div style={{ fontWeight: "600", fontSize: "14px", color: "var(--admin-ink)", marginBottom: "4px" }}>
                          No broadcasts yet
                        </div>
                        <div style={{ fontSize: "13px" }}>
                          Compose a notification or click a quick test button to get started.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    history.slice(0, ITEMS_PER_PAGE).map((item) => {
                      const badge = getTargetBadge(item.target);
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                          <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--admin-muted)", verticalAlign: "top" }}>
                            {new Date(item.sent_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                            <div style={{ fontSize: "11px", color: "var(--admin-muted-soft)", marginTop: "2px" }}>
                              {new Date(item.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>

                          <td style={{ padding: "14px 20px", verticalAlign: "top" }}>
                            <span
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "700",
                                whiteSpace: "nowrap",
                                display: "inline-block",
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td style={{ padding: "14px 20px", verticalAlign: "top" }}>
                            <div style={{ fontWeight: "700", color: "var(--admin-ink)", fontSize: "14px", marginBottom: "3px" }}>
                              {item.title}
                            </div>
                            <div
                              style={{
                                color: "var(--admin-muted)",
                                fontSize: "13px",
                                lineHeight: "1.4",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                display: "-webkit-box",
                              }}
                            >
                              {item.body}
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

          {/* Pagination Footer (8 Items per Page) */}
          {totalItems > 0 && (
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--admin-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#FAFAFA",
              }}
            >
              <div style={{ fontSize: "13px", color: "var(--admin-muted)", fontWeight: "500" }}>
                Page <strong style={{ color: "var(--admin-ink)" }}>{currentPage + 1}</strong> of{" "}
                <strong style={{ color: "var(--admin-ink)" }}>{totalPages}</strong>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0 || loading}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--admin-border)",
                    backgroundColor: "white",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: currentPage === 0 ? "not-allowed" : "pointer",
                    opacity: currentPage === 0 ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1 || loading}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--admin-border)",
                    backgroundColor: "white",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
                    opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Brand Custom Confirmation Dialog Box ── */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              padding: "26px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              border: "1px solid #E5E7EB",
              position: "relative",
            }}
          >
            {/* Close Icon */}
            <button
              onClick={() => !actionLoading && setModalOpen(false)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
                padding: "4px",
              }}
            >
              <X size={18} />
            </button>

            {modalType === "clear_history" ? (
              /* Clear History Content */
              <div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    backgroundColor: "#FEF2F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    border: "1px solid #FEE2E2",
                  }}
                >
                  <Trash2 size={24} color="#DC2626" />
                </div>

                <h3 style={{ fontSize: "19px", fontWeight: "800", color: "#111827", marginBottom: "8px" }}>
                  Clear Broadcast History?
                </h3>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.5", marginBottom: "24px" }}>
                  This will permanently delete all logged push notifications from the database. This action cannot be undone.
                </p>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setModalOpen(false)}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "white",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: "#DC2626",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "white",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                    }}
                  >
                    {actionLoading ? "Clearing..." : "Yes, Clear History"}
                  </button>
                </div>
              </div>
            ) : (
              /* Broadcast / Test Confirmation Content */
              <div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    backgroundColor: modalType === "test" ? "#F5F3FF" : "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    border: `1px solid ${modalType === "test" ? "#DDD6FE" : "#E0E7FF"}`,
                  }}
                >
                  {modalType === "test" ? <FlaskConical size={24} color="#7C3AED" /> : <Send size={24} color="#4338CA" />}
                </div>

                <h3 style={{ fontSize: "19px", fontWeight: "800", color: "#111827", marginBottom: "6px" }}>
                  {modalType === "test" ? "Send Test Broadcast?" : "Confirm Broadcast"}
                </h3>
                <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "18px" }}>
                  This will dispatch an instant push notification to the selected audience.
                </p>

                {/* Preview Box */}
                {pendingPayload && (
                  <div
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      border: "1px solid #E5E7EB",
                      marginBottom: "24px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase" }}>
                        Audience Target
                      </span>
                      {(() => {
                        const badge = getTargetBadge(pendingPayload.target);
                        return (
                          <span
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div style={{ fontWeight: "700", color: "#111827", fontSize: "14px", marginBottom: "4px" }}>
                      {pendingPayload.title}
                    </div>
                    <div style={{ color: "#4B5563", fontSize: "13px", lineHeight: "1.4" }}>
                      {pendingPayload.body}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setModalOpen(false)}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "white",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    disabled={actionLoading}
                    style={{
                      flex: 1.3,
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: modalType === "test" ? "#7C3AED" : "#4338CA",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "white",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      boxShadow: `0 4px 12px ${modalType === "test" ? "rgba(124, 58, 237, 0.25)" : "rgba(67, 56, 202, 0.25)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {actionLoading ? "Sending..." : <><Send size={15} /> Confirm & Send</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
