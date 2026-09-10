"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { businessSupabase } from "@/lib/supabaseAdminClient";
import { portalFetch } from "@/lib/portalFetch";
import { LayoutDashboard, Truck, Key, LogOut, Briefcase, Loader2, Settings } from "lucide-react";
import "@/styles/portal.css";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (pathname === "/business" || pathname === "/business/login" || pathname === "/business/register" || pathname === "/business/pending") {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await businessSupabase.auth.getSession();
        if (!session) {
          router.push("/business/login");
          setLoading(false);
          return;
        }

        // Verify business_owner or admin role via backend
        const me = await portalFetch("/business/portal/me").catch(() => null);
        const role = me?.role;
        if (role !== "admin" && role !== "business_owner") {
          router.push("/business/register");
          setLoading(false);
          return;
        }

        if (!me?.business && role !== "admin") {
          // Check if they have a pending business
          const pendingBiz = me?.business_status;
          if (pendingBiz === "pending") {
            router.push("/business/pending");
          } else {
            router.push("/business/register");
          }
          setLoading(false);
          return;
        }

        setUser({ email: session.user.email, role, businessName: me?.business?.name || "Business" });
      } catch (err) {
        console.error("Business guard failed:", err);
        router.push("/business/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [pathname, router]);

  const handleLogout = async () => {
    await businessSupabase.auth.signOut();
    router.push("/business/login");
  };

  // Public landing and login page do not get the admin sidebar shell
  if (pathname === "/business" || pathname === "/business/login" || pathname === "/business/register" || pathname === "/business/pending") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="admin-layout" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="admin-loading-center">
          <Loader2 size={18} className="admin-spin" />
          Loading business portal…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <img src="/images/final_riksho.png" alt="Riksho Business" />
        </div>
        
        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">Logistics</div>
          <Link
            href="/business/dashboard"
            className={`admin-nav-item ${pathname === "/business/dashboard" ? "active" : ""}`}
          >
            <LayoutDashboard /> Dashboard
          </Link>
          <Link
            href="/business/shipments"
            className={`admin-nav-item ${pathname === "/business/shipments" ? "active" : ""}`}
          >
            <Truck /> Shipments
          </Link>

          <div className="admin-nav-section-label">Developers</div>
          <Link
            href="/business/api-keys"
            className={`admin-nav-item ${pathname === "/business/api-keys" ? "active" : ""}`}
          >
            <Key /> API & Webhooks
          </Link>

          <div className="admin-nav-section-label">Account</div>
          <Link
            href="/business/settings"
            className={`admin-nav-item ${pathname === "/business/settings" ? "active" : ""}`}
          >
            <Settings /> Company Profile
          </Link>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-user">
            <span className="admin-header-email">{user.email}</span>
            <span className="admin-header-chip"><Briefcase size={13} /> {user.businessName}</span>
            <button onClick={handleLogout} className="admin-logout-btn">
              <LogOut /> Log out
            </button>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
