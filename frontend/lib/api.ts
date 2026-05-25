"use client";

import type {
  Contact,
  Link as LinkItem,
  Note,
  TokenPair,
  UploadOut,
  UserOut,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

const ACCESS_KEY = "satosave.access";
const REFRESH_KEY = "satosave.refresh";

type RequestOptions = RequestInit & { auth?: boolean; raw?: boolean };

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeStored(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }
}

export function getAccessToken(): string | null {
  return readStored(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return readStored(REFRESH_KEY);
}

export function storeTokens(tokens: TokenPair) {
  writeStored(ACCESS_KEY, tokens.access_token);
  writeStored(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens() {
  writeStored(ACCESS_KEY, null);
  writeStored(REFRESH_KEY, null);
}

let refreshInFlight: Promise<TokenPair | null> | null = null;

async function tryRefresh(): Promise<TokenPair | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, raw = false, headers, ...rest } = options;

  const buildHeaders = (token: string | null): HeadersInit => {
    const h = new Headers(headers ?? {});
    if (!raw && rest.body && !h.has("Content-Type")) {
      h.set("Content-Type", "application/json");
    }
    if (auth && token) {
      h.set("Authorization", `Bearer ${token}`);
    }
    return h;
  };

  let token = auth ? getAccessToken() : null;
  let response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: buildHeaders(token),
  });

  if (response.status === 401 && auth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      token = refreshed.access_token;
      response = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: buildHeaders(token),
      });
    }
  }

  if (!response.ok) {
    let detail: unknown = null;
    let message = response.statusText;
    try {
      detail = await response.json();
      if (
        detail &&
        typeof detail === "object" &&
        "detail" in (detail as Record<string, unknown>)
      ) {
        const d = (detail as { detail: unknown }).detail;
        if (typeof d === "string") message = d;
        else message = JSON.stringify(d);
      }
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  requestCode: (email: string) =>
    request<{ message: string; cooldown_seconds: number }>(
      "/auth/request-code",
      {
        method: "POST",
        body: JSON.stringify({ email }),
        auth: false,
      }
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
  me: () => request<UserOut>("/auth/me", { method: "GET" }),

  notes: {
    list: () => request<Note[]>("/notes", { method: "GET" }),
    get: (id: string) => request<Note>(`/notes/${id}`, { method: "GET" }),
    create: (payload: { title: string; content: string }) =>
      request<Note>("/notes", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: { title?: string; content?: string }) =>
      request<Note>(`/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>(`/notes/${id}`, { method: "DELETE" }),
  },

  contacts: {
    list: () => request<Contact[]>("/contacts", { method: "GET" }),
    get: (id: string) => request<Contact>(`/contacts/${id}`, { method: "GET" }),
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
    list: () => request<LinkItem[]>("/links", { method: "GET" }),
    get: (id: string) => request<LinkItem>(`/links/${id}`, { method: "GET" }),
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
    delete: (id: string) =>
      request<void>(`/links/${id}`, { method: "DELETE" }),
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
    delete: (id: string) =>
      request<void>(`/uploads/${id}`, { method: "DELETE" }),
  },
};

export { API_BASE };
