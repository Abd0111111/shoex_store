import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
      return;
    }

    const unsubFinish = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return () => {
      unsubFinish();
    };
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-white/5" />
          <div className="absolute inset-0 rounded-full border-4 border-[#e63946] border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 text-gray-500 text-sm tracking-wider uppercase font-medium">Verifying Session...</p>
      </div>
    );
  }

  const currentUser = useAuthStore.getState().user;
  const isAuth = useAuthStore.getState().isAuthenticated;

  const hasAdminAccess =
    currentUser?.email === "boodymns@gmail.com" ||
    currentUser?.role === "owner" ||
    currentUser?.role === "admin" ||
    currentUser?.isAdmin ||
    currentUser?.isOwner;

  if (!isAuth || !hasAdminAccess) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}