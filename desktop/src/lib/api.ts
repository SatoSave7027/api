import type {
  Contact,
  LinkItem,
  Note,
  TokenPair,
  UploadOut,
  UserOut,
} from "./types";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const ACCESS_KEY = "satosave.access";
const REFRESH_KEY = "satosave.refresh";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function read(key: string): string | null {
  return window.localStorage.getItem(key);
}
function write(key: string, value: string | null) {
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, value);
}

export function getAccessToken(): string | null {
  return read(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  return read(REFRESH_KEY);
}
export function storeTokens(tokens: TokenPair): void {
  write(ACCESS_KEY, tokens.access_token);
  write(REFRESH_KEY, tokens.refresh_token);
}
export function clearTokens(): void {
  write(ACCESS_KEY, null);
  write(REFRESH_KEY, null);
}

let refreshInFlight: Promise<TokenPair | null> | null = null;
async function tryRefresh(): Promise<TokenPair | null> {
  const token = getRefreshToken();
  if (!token) return null;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: token }),
      });
      if (!response.ok) {
        clearTokens();
        return null;
      }
      const data = (await response.json()) as TokenPair;
      storeTokens(data);
      return data;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

type Options = RequestInit & { auth?: boolean; raw?: boolean };

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { auth = true, raw = false, headers, ...rest } = options;

  const build = (token: string | null): HeadersInit => {
    const h = new Headers(headers ?? {});
    if (!raw && rest.body && !h.has("Content-Type")) {
      h.set("Content-Type", "application/json");
    }
    if (auth && token) h.set("Authorization", `Bearer ${token}`);
    return h;
  };

  let token = auth ? getAccessToken() : null;
  let response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: build(token),
  });
  if (response.status === 401 && auth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      token = refreshed.access_token;
      response = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: build(token),
      });
    }
  }
  if (!response.ok) {
    let detail: unknown = null;
    let message = response.statusText;
    try {
      detail = await response.json();
      const d = (detail as { detail?: unknown }).detail;
      if (typeof d === "string") message = d;
      else if (d) message = JSON.stringify(d);
    } catch {
      /* ignore */
    }
    throw new ApiError(message, response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  requestCode: (email: string) =>
    request<{ message: string; cooldown_seconds: number }>(
      "/auth/request-code",
      { method: "POST", body: JSON.stringify({ email }), auth: false }
    ),
  verifyCode: (email: string, code: string) =>
    request<TokenPair>("/auth/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
      auth: false,
    }),
  logout: () => {
    const rt = getRefreshToken();
    if (!rt) {
      clearTokens();
      return Promise.resolve();
    }
    return request<{ message: string }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: rt }),
      auth: false,
    })
      .catch(() => undefined)
      .finally(() => clearTokens());
  },
  me: () => request<UserOut>("/auth/me"),

  notes: {
    list: () => request<Note[]>("/notes"),
    get: (id: string) => request<Note>(`/notes/${id}`),
    create: (payload: { title: string; content: string }) =>
      request<Note>("/notes", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: { title?: string; content?: string }) =>
      request<Note>(`/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) => request<void>(`/notes/${id}`, { method: "DELETE" }),
  },
  contacts: {
    list: () => request<Contact[]>("/contacts"),
    get: (id: string) => request<Contact>(`/contacts/${id}`),
    create: (payload: {
      name: string;
      phone?: string | null;
      telegram_username?: string | null;
      description?: string | null;
      avatar_path?: string | null;
    }) =>
      request<Contact>("/contacts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (
      id: string,
      payload: {
        name?: string;
        phone?: string | null;
        telegram_username?: string | null;
        description?: string | null;
        avatar_path?: string | null;
      }
    ) =>
      request<Contact>(`/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>(`/contacts/${id}`, { method: "DELETE" }),
  },
  links: {
    list: () => request<LinkItem[]>("/links"),
    get: (id: string) => request<LinkItem>(`/links/${id}`),
    create: (payload: {
      title: string;
      url: string;
      description?: string | null;
      image_path?: string | null;
    }) =>
      request<LinkItem>("/links", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (
      id: string,
      payload: {
        title?: string;
        url?: string;
        description?: string | null;
        image_path?: string | null;
      }
    ) =>
      request<LinkItem>(`/links/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) => request<void>(`/links/${id}`, { method: "DELETE" }),
  },
  uploads: {
    upload: async (file: File): Promise<UploadOut> => {
      const form = new FormData();
      form.append("file", file);
      return request<UploadOut>("/uploads", {
        method: "POST",
        body: form,
        raw: true,
      });
    },
    delete: (id: string) => request<void>(`/uploads/${id}`, { method: "DELETE" }),
  },
};

export { API_BASE };
