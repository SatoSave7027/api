import Constants from "expo-constants";

import { getItem, removeItem, setItem } from "./storage";
import type {
  Contact,
  LinkItem,
  Note,
  TokenPair,
  UploadOut,
  UserOut,
} from "./types";

const extraBase =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? extraBase ?? "http://localhost:8000"
).replace(/\/$/, "");

const ACCESS_KEY = "satosave_access";
const REFRESH_KEY = "satosave_refresh";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let hydrated = false;

async function hydrate(): Promise<void> {
  if (hydrated) return;
  accessToken = await getItem(ACCESS_KEY);
  refreshToken = await getItem(REFRESH_KEY);
  hydrated = true;
}

export async function getAccessToken(): Promise<string | null> {
  await hydrate();
  return accessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  await hydrate();
  return refreshToken;
}

export async function storeTokens(tokens: TokenPair): Promise<void> {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  await setItem(ACCESS_KEY, tokens.access_token);
  await setItem(REFRESH_KEY, tokens.refresh_token);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await removeItem(ACCESS_KEY);
  await removeItem(REFRESH_KEY);
}

let refreshInFlight: Promise<TokenPair | null> | null = null;

async function tryRefresh(): Promise<TokenPair | null> {
  const token = await getRefreshToken();
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
        await clearTokens();
        return null;
      }
      const data = (await response.json()) as TokenPair;
      await storeTokens(data);
      return data;
    } catch {
      await clearTokens();
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

  const build = async (): Promise<HeadersInit> => {
    const h = new Headers(headers ?? {});
    if (!raw && rest.body && !h.has("Content-Type")) {
      h.set("Content-Type", "application/json");
    }
    if (auth) {
      const token = await getAccessToken();
      if (token) h.set("Authorization", `Bearer ${token}`);
    }
    return h;
  };

  let response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: await build(),
  });
  if (response.status === 401 && auth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: await build(),
      });
    }
  }
  if (!response.ok) {
    let detail: unknown = null;
    let message = response.statusText || "Request failed";
    try {
      detail = await response.json();
      const d = (detail as { detail?: unknown }).detail;
      if (typeof d === "string") message = d;
      else if (d) message = JSON.stringify(d);
    } catch {
      // ignore body parse errors
    }
    throw new ApiError(message, response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  hydrate,
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
  logout: async () => {
    const rt = await getRefreshToken();
    if (!rt) {
      await clearTokens();
      return;
    }
    try {
      await request<{ message: string }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: rt }),
        auth: false,
      });
    } catch {
      // ignore
    } finally {
      await clearTokens();
    }
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
    upload: async (uri: string, name: string, type: string): Promise<UploadOut> => {
      const form = new FormData();
      form.append("file", {
        uri,
        name,
        type,
      } as unknown as Blob);
      return request<UploadOut>("/uploads", {
        method: "POST",
        body: form,
        raw: true,
      });
    },
    delete: (id: string) => request<void>(`/uploads/${id}`, { method: "DELETE" }),
  },
};
