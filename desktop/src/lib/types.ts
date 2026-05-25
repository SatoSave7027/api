export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  refresh_expires_at: string;
};

export type UserOut = {
  id: string;
  email: string;
  created_at: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string | null;
  telegram_username: string | null;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UploadOut = {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  url: string;
  storage_path: string;
  created_at: string;
};
