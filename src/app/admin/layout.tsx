"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { adminFetch } from "@/lib/adminApi";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ShieldCheck,
  Loader2,
  Bell,
  UserMinus,
  MessageSquareX,
  Award,
  Tag,
  Coins,
  Menu,
  X,
  Building2,
} from "lucide-react";
import "@/styles/portal.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // If it's the login page, we don't strictly require a session to render the shell
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabaseAdminClient.auth.getSession();
        if (!session) {
          router.push("/admin/login");
          setLoading(false);
          return;
        }

        // Verify admin role via backend
        const me = await adminFetch("/admin/me");
        if (me.role !== "admin") {
          router.push("/admin/login");
          setLoading(false);
          return;
        }

        setUser(me);
      } catch (err) {
        console.error("Admin guard failed:", err);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [pathname, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabaseAdminClient.auth.signOut();
    router.push("/admin/login");
  };

  // Login page doesn't get the sidebar shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="admin-layout" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="admin-loading-center">
          <Loader2 size={18} className="admin-spin" />
          Loading admin portal…
        </div>
      </div>
    );
  }

  if (!user) return null; // Wait for redirect

  const navItems = [
    { section: "Overview", items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ]},
    { section: "Operations", items: [
      { href: "/admin/drivers", label: "Drivers", icon: Users, exact: true },
      { href: "/admin/incomplete", label: "Possible Drivers", icon: UserMinus },
      { href: "/admin/push", label: "Push Notifications", icon: Bell },
      { href: "/admin/promoters", label: "Brand Promoters", icon: Award },
      { href: "/admin/customer-promos", label: "Customer Promo Codes", icon: Coins },
      { href: "/admin/promos", label: "Driver Promos", icon: Tag },
    ]},
    { section: "Analytics", items: [
      { href: "/admin/cancellations", label: "Feedback Cancellation", icon: MessageSquareX },
    ]},
    { section: "Business", items: [
      { href: "/admin/businesses", label: "Business Approvals", icon: Building2 },
    ]},
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`admin-sidebar-backdrop ${mobileNavOpen ? "open" : ""}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar / Mobile Drawer */}
      <aside className={`admin-sidebar ${mobileNavOpen ? "open" : ""}`}>
        {/* Mobile Sidebar Header with Close Button */}
        <div className="admin-sidebar-header-mobile">
          <img src="/images/final_riksho.png" alt="Riksho Admin" style={{ height: "26px" }} />
          <button
            className="admin-sidebar-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Desktop Sidebar Logo */}
        <div className="admin-sidebar-logo">
          <img src="/images/final_riksho.png" alt="Riksho Admin" />
        </div>
        
        <nav className="admin-sidebar-nav">
          {navItems.map((group) => (
            <div key={group.section}>
              <div className="admin-nav-section-label">{group.section}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`admin-nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon /> {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          {/* Mobile Hamburger & Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="admin-mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="admin-mobile-brand">
              <img src="/images/final_riksho.png" alt="Riksho" />
            </div>
          </div>

          <div className="admin-header-user">
            <span className="admin-header-email">{user.email}</span>
            <span className="admin-header-chip"><ShieldCheck size={13} /> Admin</span>
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
