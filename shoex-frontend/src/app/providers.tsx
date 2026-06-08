import { type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

interface Props {
  children: ReactNode;
}

export default function Providers({ children }: Props) {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}