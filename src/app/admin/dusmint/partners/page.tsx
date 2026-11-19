"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import {
  Store,
  Search,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Building,
} from "lucide-react";

interface DusmintPartner {
  id: string;
  authUserId: string | null;
  name: string;
  ownerName: string;
  ownerPhone: string;
  category: string;
  address: string;
  clusterName: string;
  city: string;
  lat: number | null;
  lng: number | null;
  isOpen: boolean;
  score: number;
  status: string;
  payoutVpa: string | null;
  shopPhotos: string[];
  createdAt: string;
}

export default function DusmintPartnersPage() {
  const [partners, setPartners] = useState<DusmintPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append("q", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);

      const data = await adminFetch(`/admin/dusmint/partners?${params.toString()}`);
      const rawList = Array.isArray(data) ? data : [];
      const normalized: DusmintPartner[] = rawList.map((p: any) => ({
        id: p.id,
        authUserId: p.authUserId || p.auth_user_id || null,
        name: p.name || "",
        ownerName: p.ownerName || p.owner_name || "Partner",
        ownerPhone: p.ownerPhone || p.owner_phone || "",
        category: p.category || "groceries",
        address: p.address || (p.clusters ? `${p.clusters.name}, ${p.clusters.city}` : "Patna"),
        clusterName: p.clusterName || p.clusters?.name || "Central Mandi",
        city: p.city || p.clusters?.city || "Patna",
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        isOpen: p.isOpen ?? p.is_open ?? false,
        score: p.score ?? 0,
        status: p.status || "pending",
        payoutVpa: p.payoutVpa || p.bank_or_upi || null,
        shopPhotos: p.shopPhotos || p.shop_photo_urls || [],
        createdAt: p.createdAt || p.created_at || "",
      }));
      setPartners(normalized);
    } catch (err) {
      console.error("Failed to load DusMint partners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPartners();
  };

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
                backgroundColor: "#E8F5EC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Store size={20} color="#047A36" />
            </div>
            <h1 className="admin-page-title" style={{ fontSize: "24px", fontWeight: "800", color: "var(--admin-ink)" }}>
              DusMint Partners
            </h1>
            <span
              style={{
                backgroundColor: "#E8F5EC",
                color: "#047A36",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              Quick Commerce
            </span>
          </div>
          <p className="admin-page-subtitle" style={{ color: "var(--admin-muted)" }}>
            Verified mandi stores, vegetable sellers, and local partners fulfilled via DusMint.
          </p>
        </div>

        <button
          onClick={() => fetchPartners()}
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
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: "260px", display: "flex", gap: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              color="#9CA3AF"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by shop name, owner name, or phone..."
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
          <button
            type="submit"
            style={{
              padding: "9px 16px",
              backgroundColor: "#047A36",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>Status:</span>
          {["all", "active", "pending", "suspended"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "capitalize",
                border: statusFilter === st ? "1px solid #047A36" : "1px solid var(--admin-border)",
                backgroundColor: statusFilter === st ? "#E8F5EC" : "white",
                color: statusFilter === st ? "#047A36" : "var(--admin-muted)",
                cursor: "pointer",
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Table */}
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
                    SHOP & CATEGORY
                  </th>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    OWNER / CONTACT
                  </th>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    LOCATION & CLUSTER
                  </th>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    PAYOUT (UPI)
                  </th>
                  <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", fontWeight: "700", color: "var(--admin-muted)" }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
                      Loading DusMint partners...
                    </td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "64px 20px", textAlign: "center", color: "var(--admin-muted)" }}>
                      <Store size={36} color="#CBD5E1" style={{ margin: "0 auto 12px" }} />
                      <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--admin-ink)", marginBottom: "4px" }}>
                        No DusMint partners found
                      </div>
                      <div style={{ fontSize: "13px" }}>
                        Partners who finish the 4-step vendor onboarding will appear here.
                      </div>
                    </td>
                  </tr>
                ) : (
                  partners.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                      {/* Shop Name & Category */}
                      <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {p.shopPhotos && p.shopPhotos.length > 0 ? (
                            <img
                              src={p.shopPhotos[0]}
                              alt={p.name}
                              style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "8px",
                                backgroundColor: "#F3F4F6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ShoppingBag size={20} color="#9CA3AF" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--admin-ink)", fontSize: "14px" }}>
                              {p.name}
                            </div>
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "3px",
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#047A36",
                                backgroundColor: "#E8F5EC",
                                padding: "2px 7px",
                                borderRadius: "4px",
                              }}
                            >
                              {p.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: "600", color: "var(--admin-ink)", fontSize: "13px" }}>
                          {p.ownerName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <a
                            href={`tel:${p.ownerPhone}`}
                            style={{
                              fontSize: "12px",
                              color: "#2563EB",
                              fontWeight: "500",
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Phone size={12} /> {p.ownerPhone}
                          </a>
                          <a
                            href={`https://wa.me/${(p.ownerPhone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "11px",
                              backgroundColor: "#DCFCE7",
                              color: "#16A34A",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontWeight: "700",
                              textDecoration: "none",
                            }}
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>

                      {/* Location & Cluster */}
                      <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                        <div style={{ fontSize: "13px", color: "var(--admin-ink)", fontWeight: "500", maxWidth: "240px", lineHeight: "1.3" }}>
                          {p.address}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                          <span style={{ fontSize: "11px", color: "var(--admin-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Building size={11} /> {p.clusterName} ({p.city})
                          </span>
                          {p.lat && p.lng && (
                            <a
                              href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "11px",
                                color: "#047A36",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                textDecoration: "none",
                              }}
                            >
                              <MapPin size={11} /> Map <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Payout UPI */}
                      <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                        {p.payoutVpa ? (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 8px",
                              backgroundColor: "#F8FAFC",
                              borderRadius: "6px",
                              border: "1px solid #E2E8F0",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#334155",
                            }}
                          >
                            <CreditCard size={13} color="#047A36" /> {p.payoutVpa}
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--admin-muted-soft)" }}>Not configured</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: p.isOpen ? "#16A34A" : "#9CA3AF",
                            }}
                          />
                          <span style={{ fontSize: "12px", fontWeight: "700", color: p.isOpen ? "#16A34A" : "#64748B" }}>
                            {p.isOpen ? "Open" : "Closed"}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--admin-muted)", marginTop: "3px" }}>
                          Rating: ⭐ {p.score}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
