import { Contact, LinkItem, Note, Tokens, UploadedFile, User } from "./types";

type Section = "notes" | "contacts" | "links";

interface ClientOptions {
  baseUrl: string;
  getTokens: () => Tokens | null;
  setTokens: (tokens: Tokens | null) => void;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function parseErrorMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null) {
    const maybeError = payload as { error?: { message?: string }; detail?: string };
    if (maybeError.error?.message) {
      return maybeError.error.message;
    }
    if (maybeError.detail) {
      return maybeError.detail;
    }
  }
  return "Request failed";
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getTokens: () => Tokens | null;
  private readonly setTokens: (tokens: Tokens | null) => void;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.getTokens = options.getTokens;
    this.setTokens = options.setTokens;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    requiresAuth = true,
    canRetry = true,
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    const tokens = this.getTokens();
    if (requiresAuth) {
      if (!tokens) {
        throw new ApiError("Not authenticated", 401);
      }
      headers.set("Authorization", `Bearer ${tokens.access_token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401 && requiresAuth && canRetry) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request<T>(path, options, requiresAuth, false);
      }
    }

    if (response.status === 204) {
      return undefined as T;
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new ApiError(parseErrorMessage(payload), response.status);
    }
    return payload as T;
  }

  private async refreshToken(): Promise<boolean> {
    const current = this.getTokens();
    if (!current?.refresh_token) {
      this.setTokens(null);
      return false;
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });

    if (!response.ok) {
      this.setTokens(null);
      return false;
    }

    const refreshed = (await response.json()) as Tokens;
    this.setTokens(refreshed);
    return true;
  }

  async requestCode(email: string): Promise<void> {
    await this.request<{ message: string }>(
      "/auth/request-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
      false,
      false,
    );
  }

  async verifyCode(email: string, code: string): Promise<Tokens> {
    const tokens = await this.request<Tokens>(
      "/auth/verify-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      },
      false,
      false,
    );
    this.setTokens(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getTokens()?.refresh_token;
    await this.request<{ message: string }>(
      "/auth/logout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      true,
      false,
    );
    this.setTokens(null);
  }

  me(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  listNotes(): Promise<Note[]> {
    return this.request<Note[]>("/notes");
  }

  getNote(noteId: string): Promise<Note> {
    return this.request<Note>(`/notes/${noteId}`);
  }

  createNote(payload: { title: string; content: string }): Promise<Note> {
    return this.request<Note>("/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  updateNote(noteId: string, payload: Partial<{ title: string; content: string }>): Promise<Note> {
    return this.request<Note>(`/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  deleteNote(noteId: string): Promise<void> {
    return this.request<void>(`/notes/${noteId}`, { method: "DELETE" });
  }

  listContacts(): Promise<Contact[]> {
    return this.request<Contact[]>("/contacts");
  }

  getContact(contactId: string): Promise<Contact> {
    return this.request<Contact>(`/contacts/${contactId}`);
  }

  createContact(payload: {
    name: string;
    phone?: string | null;
    telegram_username?: string | null;
    description?: string | null;
    avatar_file_id?: string | null;
  }): Promise<Contact> {
    return this.request<Contact>("/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  updateContact(
    contactId: string,
    payload: Partial<{
      name: string;
      phone: string | null;
      telegram_username: string | null;
      description: string | null;
      avatar_file_id: string | null;
    }>,
  ): Promise<Contact> {
    return this.request<Contact>(`/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  deleteContact(contactId: string): Promise<void> {
    return this.request<void>(`/contacts/${contactId}`, { method: "DELETE" });
  }

  listLinks(): Promise<LinkItem[]> {
    return this.request<LinkItem[]>("/links");
  }

  getLink(linkId: string): Promise<LinkItem> {
    return this.request<LinkItem>(`/links/${linkId}`);
  }

  createLink(payload: {
    title: string;
    url: string;
    description?: string | null;
    image_file_id?: string | null;
  }): Promise<LinkItem> {
    return this.request<LinkItem>("/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  updateLink(
    linkId: string,
    payload: Partial<{
      title: string;
      url: string;
      description: string | null;
      image_file_id: string | null;
    }>,
  ): Promise<LinkItem> {
    return this.request<LinkItem>(`/links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  deleteLink(linkId: string): Promise<void> {
    return this.request<void>(`/links/${linkId}`, { method: "DELETE" });
  }

  uploadImage(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<UploadedFile>("/uploads", { method: "POST", body: formData });
  }

  deleteUpload(fileId: string): Promise<void> {
    return this.request<void>(`/uploads/${fileId}`, { method: "DELETE" });
  }

  async loadSection(section: Section): Promise<Note[] | Contact[] | LinkItem[]> {
    if (section === "notes") return this.listNotes();
    if (section === "contacts") return this.listContacts();
    return this.listLinks();
  }
}
