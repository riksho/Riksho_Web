import {
  adminSupabase,
  businessSupabase,
  darkstoreSupabase,
  promoterSupabase,
} from "./supabaseAdminClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://riksho-backend-htdg.onrender.com";

/**
 * Resolves the appropriate isolated Supabase client based on the active browser path
 * or the API endpoint being requested.
 */
function resolvePortalClient(endpoint: string) {
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/refer-earn")) return promoterSupabase;
    if (pathname.startsWith("/business")) return businessSupabase;
    if (pathname.startsWith("/darkstore")) return darkstoreSupabase;
    if (pathname.startsWith("/admin")) return adminSupabase;
  }

  // Fallback check by API endpoint
  if (endpoint.startsWith("/promoters")) return promoterSupabase;
  if (endpoint.startsWith("/business")) return businessSupabase;
  if (endpoint.startsWith("/orders") || endpoint.startsWith("/darkstore")) return darkstoreSupabase;
  if (endpoint.startsWith("/admin")) return adminSupabase;

  return adminSupabase;
}

/**
 * Authenticated fetch for all portal types with automatic portal session routing.
 * Ensures multi-window / multi-tab browser sessions (Admin, Business, Darkstore, Promoter)
 * never clash with or overwrite each other's credentials.
 */
export async function portalFetch(endpoint: string, options: RequestInit = {}) {
  const client = resolvePortalClient(endpoint);
  const { data: { session } } = await client.auth.getSession();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = `Error ${response.status}`;
    try {
      const err = await response.json();
      errMessage = err.message || err.error || errMessage;
    } catch (e) {
      // Ignore parse error
    }
    throw new Error(errMessage);
  }

  const contentType = response.headers.get("content-type");
  if (response.status === 204 || (contentType && !contentType.includes("application/json"))) {
    return { success: true };
  }

  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

// Dedicated helpers for direct portal usage
export const promoterFetch = (endpoint: string, options: RequestInit = {}) => portalFetch(endpoint, options);
export const businessFetch = (endpoint: string, options: RequestInit = {}) => portalFetch(endpoint, options);
export const darkstoreFetch = (endpoint: string, options: RequestInit = {}) => portalFetch(endpoint, options);
