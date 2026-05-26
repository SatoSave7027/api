export type User = { id: string; email: string; created_at: string };
export type Note = { id: string; title: string; content: string; created_at: string; updated_at: string };
export type Contact = { id: string; name: string; phone: string | null; telegram_username: string | null; description: string | null; avatar_file_id: string | null; avatar_url: string | null; created_at: string; updated_at: string };
export type LinkItem = { id: string; title: string; url: string; description: string | null; image_file_id: string | null; image_url: string | null; created_at: string; updated_at: string };
export type UploadResult = { id: string; url: string; content_type: string; size: number; original_name: string; created_at: string };
type Tokens = { access_token: string; refresh_token: string; expires_in: number; user: User };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const absoluteMediaUrl = (path: string | null) => !path ? null : path.startsWith("http") ? path : `${API_URL}${path}`;
export const tokenStore = {
  getAccess: () => typeof window === "undefined" ? null : window.sessionStorage.getItem("satosave_access"),
  getRefresh: () => typeof window === "undefined" ? null : window.sessionStorage.getItem("satosave_refresh"),
  set(tokens: Tokens) { window.sessionStorage.setItem("satosave_access", tokens.access_token); window.sessionStorage.setItem("satosave_refresh", tokens.refresh_token); },
  clear() { if (typeof window !== "undefined") { window.sessionStorage.removeItem("satosave_access"); window.sessionStorage.removeItem("satosave_refresh"); } }
};
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const access = tokenStore.getAccess();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && tokenStore.getRefresh()) { await api.refresh(); return request<T>(path, init, false); }
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error?.message || body?.detail || "Request failed"); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  requestCode: (email: string) => request<{ message: string }>("/auth/request-code", { method: "POST", body: JSON.stringify({ email }) }, false),
  async verifyCode(email: string, code: string) { const tokens = await request<Tokens>("/auth/verify-code", { method: "POST", body: JSON.stringify({ email, code }) }, false); tokenStore.set(tokens); return tokens.user; },
  async refresh() { const refreshToken = tokenStore.getRefresh(); if (!refreshToken) throw new Error("No refresh token"); const tokens = await request<Tokens>("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }, false); tokenStore.set(tokens); return tokens.user; },
  async logout() { const refreshToken = tokenStore.getRefresh(); await request("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }).catch(() => undefined); tokenStore.clear(); },
  me: () => request<User>("/auth/me"),
  notes: { list: () => request<Note[]>("/notes"), create: (payload: Pick<Note, "title" | "content">) => request<Note>("/notes", { method: "POST", body: JSON.stringify(payload) }), update: (id: string, payload: Partial<Pick<Note, "title" | "content">>) => request<Note>(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(payload) }), remove: (id: string) => request<void>(`/notes/${id}`, { method: "DELETE" }) },
  contacts: { list: () => request<Contact[]>("/contacts"), create: (payload: Partial<Contact>) => request<Contact>("/contacts", { method: "POST", body: JSON.stringify(payload) }), update: (id: string, payload: Partial<Contact>) => request<Contact>(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }), remove: (id: string) => request<void>(`/contacts/${id}`, { method: "DELETE" }) },
  links: { list: () => request<LinkItem[]>("/links"), create: (payload: Partial<LinkItem>) => request<LinkItem>("/links", { method: "POST", body: JSON.stringify(payload) }), update: (id: string, payload: Partial<LinkItem>) => request<LinkItem>(`/links/${id}`, { method: "PATCH", body: JSON.stringify(payload) }), remove: (id: string) => request<void>(`/links/${id}`, { method: "DELETE" }) },
  upload(file: File) { const data = new FormData(); data.append("file", file); return request<UploadResult>("/uploads", { method: "POST", body: data }); },
  deleteUpload: (id: string) => request<void>(`/uploads/${id}`, { method: "DELETE" })
};
