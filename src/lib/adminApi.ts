import { supabaseAdminClient } from "./supabaseAdminClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://riksho-backend-htdg.onrender.com";

export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  // Get current session token
  const { data: { session } } = await supabaseAdminClient.auth.getSession();
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type: application/json if there is actually a body payload!
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

  // If response has no content (204 No Content or empty string)
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || (contentType && !contentType.includes("application/json"))) {
    return { success: true };
  }

  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}
