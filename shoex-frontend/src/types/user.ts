export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "owner" | "editor" | "viewer";
  avatar?: string;
  phone?: string;
  isAdmin?: boolean;
  isOwner?: boolean;
}