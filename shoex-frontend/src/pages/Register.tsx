import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight,
  User, Phone, CheckCircle2,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v: string) => /^01[0-2,5]{1}[0-9]{8}$/.test(v);

interface Step1Props {
  onNext: (email: string, password: string) => void;
  onGoogleSuccess: (credential: string) => void;
  googleLoading: boolean;
}

function StepCredentials({ onNext, onGoogleSuccess, googleLoading }: Step1Props) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showP,    setShowP]    = useState(false);
  const [showC,    setShowC]    = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const googleBtnRef = useRef<HTMLDivElement>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isValidEmail(email))    e.email    = "Enter a valid email address";
    if (password.length < 6)     e.password = "Password must be at least 6 characters";
    if (password !== confirm)    e.confirm  = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) onNext(email.trim().toLowerCase(), password);
  };

  const inputBase = "w-full bg-[#0d0d0d] border rounded-xl py-3 text-white text-sm outline-none transition-all placeholder:text-gray-600";
  const inputCls  = (key: string) =>
    `${inputBase} ${errors[key] ? "border-red-500/60 focus:border-red-500" : "border-white/8 focus:border-[#e63946]/50 hover:border-white/12"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Google Button — شكل أصلي فوق، GoogleLogin مخفي تحت */}
      <div className="relative">
        <div
          ref={googleBtnRef}
          className="absolute inset-0 opacity-0 overflow-hidden rounded-xl"
          style={{ zIndex: 1 }}
        >
          <GoogleLogin
            onSuccess={(credentialResponse) =>
              onGoogleSuccess(credentialResponse.credential!)
            }
            onError={() => {}}
            useOneTap={false}
            theme="filled_black"
            size="large"
            width="368"
            text="continue_with"
          />
        </div>

        <button
          type="button"
          disabled={googleLoading}
          className="relative w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-xl transition-all duration-200 text-sm disabled:opacity-60"
          style={{ zIndex: 2 }}
          onClick={() => {
            const btn = googleBtnRef.current?.querySelector("div[role=button]") as HTMLElement;
            btn?.click();
          }}
        >
          {googleLoading ? (
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

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/6" />
        <span className="text-gray-600 text-xs font-medium">or</span>
        <div className="flex-1 h-px bg-white/6" />
      </div>

      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Email</label>
        <div className="relative">
          <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
            placeholder="you@example.com"
            className={`${inputCls("email")} pl-10 pr-4`}
          />
        </div>
        {errors.email && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
      </div>

      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          <input
            type={showP ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
            placeholder="Min. 6 characters"
            className={`${inputCls("password")} pl-10 pr-11`}
          />
          <button type="button" onClick={() => setShowP(!showP)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
            {showP ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.password}</p>}
      </div>

      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Confirm Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          <input
            type={showC ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: "" })); }}
            placeholder="Repeat your password"
            className={`${inputCls("confirm")} pl-10 pr-11`}
          />
          <button type="button" onClick={() => setShowC(!showC)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
            {showC ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirm && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.confirm}</p>}
      </div>

      <button type="submit" className="w-full bg-[#e63946] hover:bg-[#c1121f] text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-2 shadow-lg shadow-[#e63946]/20">
        Continue <ArrowRight size={15} />
      </button>
    </form>
  );
}

interface Step2Props {
  email: string;
  password: string;
  onDone: () => void;
}

function StepProfile({ email, password, onDone }: Step2Props) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name  = "Name must be at least 2 characters";
    if (!isValidPhone(phone))   e.phone = "Enter a valid Egyptian phone number (01xxxxxxxxx)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, token, refreshToken } = await authService.register(
        name.trim(),
        email,
        password,
        phone
      );
      toast.success("Account created successfully!");
      setAuth(user, token, refreshToken);
      onDone();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Registration failed. Please try again.";
      setErrors({ name: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "w-full bg-[#0d0d0d] border rounded-xl py-3 text-white text-sm outline-none transition-all placeholder:text-gray-600";
  const inputCls  = (key: string) =>
    `${inputBase} ${errors[key] ? "border-red-500/60 focus:border-red-500" : "border-white/8 focus:border-[#e63946]/50 hover:border-white/12"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Full Name</label>
        <div className="relative">
          <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
            placeholder="John Doe"
            className={`${inputCls("name")} pl-10 pr-4`}
          />
        </div>
        {errors.name && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
      </div>

      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Phone Number</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none pointer-events-none">+20</span>
          <Phone size={15} className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          <input
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
            placeholder="01xxxxxxxxx"
            maxLength={11}
            className={`${inputCls("phone")} pl-20 pr-4`}
          />
        </div>
        {errors.phone && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.phone}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-2 shadow-lg shadow-[#e63946]/20"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <><CheckCircle2 size={15} /> Create Account</>
        )}
      </button>
    </form>
  );
}

export default function Register() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore((s) => s.setAuth);

  const [step,        setStep]        = useState<1 | 2>(1);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [googleLoad,  setGoogleLoad]  = useState(false);
  const [googleError, setGoogleError] = useState("");

  const handleGoogleSuccess = async (credential: string) => {
    setGoogleLoad(true);
    setGoogleError("");
    try {
      const { user, token, refreshToken } = await authService.googleAuth(credential);
      toast.success("Login successful!");
      setAuth(user, token, refreshToken);
      navigate("/account");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Google login failed.";
      setGoogleError(msg);
    } finally {
      setGoogleLoad(false);
    }
  };

  const handleStep1Done = (email: string, password: string) => {
    setCredentials({ email, password });
    setStep(2);
  };

  const handleDone = () => navigate("/account");

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 pt-20 pb-10">
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
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  step >= s ? "bg-[#e63946] text-white" : "bg-white/8 text-gray-600"
                }`}>{s}</div>
                {s < 2 && (
                  <div className={`h-px w-8 transition-all duration-500 ${step > s ? "bg-[#e63946]" : "bg-white/8"}`} />
                )}
              </div>
            ))}
            <span className="text-xs text-gray-500 ml-2">
              {step === 1 ? "Account Setup" : "Your Details"}
            </span>
          </div>

          {googleError && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 mb-4">
              <AlertCircle size={13} className="flex-shrink-0" />
              {googleError}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-black text-white mb-1">Create account</h1>
                <p className="text-gray-500 text-sm mb-6">Join SHOEX and start shopping</p>
                <StepCredentials
                  onNext={handleStep1Done}
                  onGoogleSuccess={handleGoogleSuccess}
                  googleLoading={googleLoad}
                />
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-black text-white mb-1">Almost there!</h1>
                <p className="text-gray-500 text-sm mb-6">Tell us a bit about yourself</p>
                <StepProfile email={credentials.email} password={credentials.password} onDone={handleDone} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#e63946] hover:text-[#c1121f] font-bold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}