export type UUID = string;

export interface User {
  id: UUID;
  email: string;
  created_at: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: User;
}

export interface Note {
  id: UUID;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: UUID;
  name: string;
  phone: string | null;
  telegram_username: string | null;
  description: string | null;
  avatar_file_id: UUID | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkItem {
  id: UUID;
  title: string;
  url: string;
  description: string | null;
  image_file_id: UUID | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: UUID;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  public_url: string;
  created_at: string;
}
