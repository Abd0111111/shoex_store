import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email,      setEmail]     = useState("");
  const [password,   setPassword]  = useState("");
  const [showPass,   setShowPass]  = useState(false);
  const [error,      setError]     = useState("");
  const [loading,    setLoading]   = useState(false);
  const [googleLoad, setGoogleLoad]= useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await login(email.trim().toLowerCase(), password);
      if (success) {
        toast.success("Welcome back!");
        const currentUser = useAuthStore.getState().user;
        if (
          currentUser?.email === "boodymns@gmail.com" ||
          currentUser?.role === "owner" ||
          currentUser?.role === "admin" ||
          currentUser?.isAdmin
        ) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/account", { replace: true });
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 pt-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e63946]/6 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-[#e63946] rounded-xl flex items-center justify-center shadow-lg shadow-[#e63946]/30">
            <span className="text-white font-black text-base">S</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-white">SHOEX</span>
        </div>

        <div className="bg-[#111111] border border-white/6 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account</p>

          {/* Google Button — شكل أصلي فوق، GoogleLogin مخفي تحت */}
          <div className="relative mb-6">
            {/* الزرار المخفي بتاع GoogleLogin */}
            <div
              ref={googleBtnRef}
              className="absolute inset-0 opacity-0 overflow-hidden rounded-xl"
              style={{ zIndex: 1 }}
            >
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setGoogleLoad(true);
                  try {
                    const googleLogin = useAuthStore.getState().googleLogin;
                    const success = await googleLogin(credentialResponse.credential!);
                    if (success) {
                      toast.success("Welcome back!");
                      const currentUser = useAuthStore.getState().user;
                      if (
                        currentUser?.email === "boodymns@gmail.com" ||
                        currentUser?.role === "owner" ||
                        currentUser?.role === "admin" ||
                        currentUser?.isAdmin
                      ) {
                        navigate("/admin", { replace: true });
                      } else {
                        navigate("/account", { replace: true });
                      }
                    }
                  } catch (err: unknown) {
                    const msg =
                      (err as { response?: { data?: { error?: string } } })
                        ?.response?.data?.error ?? "Google login failed.";
                    setError(msg);
                  } finally {
                    setGoogleLoad(false);
                  }
                }}
                onError={() => setError("Google login failed. Please try again.")}
                useOneTap={false}
                theme="filled_black"
                size="large"
                width="368"
                text="continue_with"
              />
            </div>

            {/* الزرار الأصلي فوقه */}
            <button
              type="button"
              disabled={googleLoad || loading}
              className="relative w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-xl transition-all duration-200 text-sm disabled:opacity-60"
              style={{ zIndex: 2 }}
              onClick={() => {
                const btn = googleBtnRef.current?.querySelector("div[role=button]") as HTMLElement;
                btn?.click();
              }}
            >
              {googleLoad ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-gray-600 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none transition-all placeholder:text-gray-600 focus:border-[#e63946]/50 hover:border-white/12"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-400 font-medium">Password</label>
                <button type="button" className="text-xs text-[#e63946] hover:text-[#c1121f] transition-colors font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl pl-10 pr-11 py-3 text-white text-sm outline-none transition-all placeholder:text-gray-600 focus:border-[#e63946]/50 hover:border-white/12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 text-red-400 text-xs bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3"
                >
                  <AlertCircle size={13} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || googleLoad}
              className="w-full bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-2 shadow-lg shadow-[#e63946]/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#e63946] hover:text-[#c1121f] font-bold transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}