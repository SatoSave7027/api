export type User = { id: string; email: string; created_at: string };
export type Note = { id: string; title: string; content: string; created_at: string; updated_at: string };
export type Contact = { id: string; name: string; phone: string | null; telegram_username: string | null; description: string | null; avatar_file_id: string | null; avatar_url: string | null; created_at: string; updated_at: string };
export type LinkItem = { id: string; title: string; url: string; description: string | null; image_file_id: string | null; image_url: string | null; created_at: string; updated_at: string };
export type Section = "notes" | "contacts" | "links";
type Tokens = { access_token: string; refresh_token: string; expires_in: number; user: User };
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const mediaUrl = (path: string | null) => !path ? null : path.startsWith("http") ? path : `${API_URL}${path}`;
const store = {
  access: () => sessionStorage.getItem("satosave_access"),
  refresh: () => sessionStorage.getItem("satosave_refresh"),
  set(tokens: Tokens) { sessionStorage.setItem("satosave_access", tokens.access_token); sessionStorage.setItem("satosave_refresh", tokens.refresh_token); },
  clear() { sessionStorage.clear(); }
};
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const access = store.access();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && store.refresh()) { await api.refresh(); return request<T>(path, init, false); }
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error?.message || "Request failed"); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  hasSession: () => Boolean(store.access()),
  clear: store.clear,
  requestCode: (email: string) => request<{ message: string }>("/auth/request-code", { method: "POST", body: JSON.stringify({ email }) }, false),
  async verifyCode(email: string, code: string) { const tokens = await request<Tokens>("/auth/verify-code", { method: "POST", body: JSON.stringify({ email, code }) }, false); store.set(tokens); return tokens.user; },
  async refresh() { const token = store.refresh(); if (!token) throw new Error("No refresh token"); const tokens = await request<Tokens>("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: token }) }, false); store.set(tokens); return tokens.user; },
  me: () => request<User>("/auth/me"),
  logout: async () => { await request("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: store.refresh() }) }).catch(() => undefined); store.clear(); },
  list: (section: Section) => request<(Note | Contact | LinkItem)[]>(`/${section}`),
  create: (section: Section, payload: unknown) => request(`/${section}`, { method: "POST", body: JSON.stringify(payload) }),
  update: (section: Section, id: string, payload: unknown) => request(`/${section}/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (section: Section, id: string) => request<void>(`/${section}/${id}`, { method: "DELETE" }),
  upload: (file: File) => { const data = new FormData(); data.append("file", file); return request<{ id: string; url: string }>("/uploads", { method: "POST", body: data }); }
};
