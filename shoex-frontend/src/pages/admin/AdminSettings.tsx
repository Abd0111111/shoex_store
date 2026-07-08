// src/pages/admin/AdminSettings.tsx
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, CreditCard, Truck, Shield, Users, Bell,
  Eye, EyeOff, Plus, Trash2, AlertTriangle, Check, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { adminService } from "@/services/admin.service";
import api from "@/services/api";

// ─── Types ────────────────────────────────────────────
interface StoreInfo {
  storeName: string;
  storeUrl: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  taxId: string;
  bizType: string;
  currency: string;
  timezone: string;
  language: string;
  prefs: {
    enableReviews: boolean;
    guestCheckout: boolean;
    orderEmails: boolean;
    newsletter: boolean;
    showOutOfStock?: boolean;
    maintenanceMode?: boolean;
  };
}

interface PaymentSettings {
  stripeEnabled: boolean;
  stripeKey: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  cashOnDelivery: boolean;
  testMode: boolean;
}

interface ShippingLocation {
  id: string;
  city: string;
  rate: number;
  deliveryDays: string;
  isCustom?: boolean;
}

interface ShippingSettings {
  freeShippingThreshold: string;
  locations: ShippingLocation[];
  processingDays: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "Admin" | "Editor" | "Viewer";
}

interface NotificationSettings {
  newOrder: boolean;
  lowStock: boolean;
  newReview: boolean;
  newCustomer: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  emailRecipient: string;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  sessionTimeout: string;
}

// ─── Validation helpers ───────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidUrl   = (v: string) => {
  try { new URL(v.startsWith("http") ? v : `https://${v}`); return true; } catch { return false; }
};
const isValidPhone = (v: string) => /^[+\d\s().-]{7,}$/.test(v);

// ─── Unsaved badge ────────────────────────────────────
function UnsavedDot() {
  return <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />;
}

// ── Shared field component ────────────────────────
const Field = ({
  id, label, error, children,
}: { id: string; label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <div className="mt-1">{children}</div>
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
  </div>
);

// ── Toggle component ──────────────────────────────
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <div
    onClick={() => onChange(!checked)}
    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${checked ? "bg-[#dc143c]" : "bg-gray-700"}`}
  >
    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${checked ? "left-5" : "left-1"}`} />
  </div>
);

// ── Save / Cancel footer ──────────────────────────
const SaveBar = ({ onSave, onCancel, dirty }: { onSave: () => void; onCancel?: () => void; dirty: boolean }) => (
  <div className="flex gap-3 pt-4 border-t border-white/5">
    <Button onClick={onSave} className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white">
      <Check className="w-4 h-4 mr-2" /> Save Changes
    </Button>
    {onCancel && (
      <Button variant="outline" onClick={onCancel} className="border-white/10 text-white hover:bg-white/5">
        Cancel
      </Button>
    )}
    {dirty && <span className="text-xs text-amber-400 self-center">Unsaved changes</span>}
  </div>
);

// ─── Nav definition ───────────────────────────────────
const NAV_BASE = [
  { icon: Store,      label: "Store Information" },
  { icon: CreditCard, label: "Payment Settings"  },
  { icon: Truck,      label: "Shipping Settings" },
  { icon: Users,      label: "Team & Permissions"},
  { icon: Bell,       label: "Notifications"     },
  { icon: Shield,     label: "Security"          },
];

// Owner identifier (used as a visual reminder/fallback)
const OWNER_EMAIL = "boodymns@gmail.com";

// ─── Default values ───────────────────────────────────
const DEFAULT_STORE: StoreInfo = {
  storeName: "SHOEX Store",
  storeUrl: "shoex.com",
  storeEmail: "contact@shoex.com",
  storePhone: "+1 (555) 000-0000",
  storeAddress: "123 Commerce Street, New York, NY 10001",
  taxId: "XX-XXXXXXX",
  bizType: "E-commerce",
  currency: "EGP",
  timezone: "America/New_York",
  language: "English",
  prefs: {
    enableReviews: true,
    guestCheckout: true,
    orderEmails: true,
    newsletter: false,
    showOutOfStock: true,
    maintenanceMode: false,
  },
};

const DEFAULT_PAYMENT: PaymentSettings = {
  stripeEnabled: true,
  stripeKey: "",
  paypalEnabled: false,
  paypalClientId: "",
  cashOnDelivery: false,
  testMode: true,
};

const DEFAULT_SHIPPING: ShippingSettings = {
  freeShippingThreshold: "500",
  locations: [],
  processingDays: "1",
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  newOrder: true,
  lowStock: true,
  newReview: false,
  newCustomer: true,
  dailyReport: false,
  weeklyReport: true,
  emailRecipient: "contact@shoex.com",
};

const DEFAULT_SECURITY: SecuritySettings = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  twoFactorEnabled: false,
  sessionTimeout: "60",
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function AdminSettings() {
  const [active, setActive] = useState(0);

  // ── Auth context for role verification ─────────────────
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === "owner";

  // ── Dynamic NAV based on owner status ──────────────
  const NAV = isOwner ? NAV_BASE : NAV_BASE.filter((item) => item.label !== "Team & Permissions");

  // ── Per-section state ─────────────────────────────
  const [store,         setStore]         = useState<StoreInfo>(DEFAULT_STORE);
  const [storeDirty,    setStoreDirty]    = useState(false);

  const [payment,       setPayment]       = useState<PaymentSettings>(DEFAULT_PAYMENT);
  const [paymentDirty,  setPaymentDirty]  = useState(false);

  const [shipping,      setShipping]      = useState<ShippingSettings>(DEFAULT_SHIPPING);
  const [shippingDirty, setShippingDirty] = useState(false);

  // ── Custom zone form state ───────────────────────
  const [customZoneName, setCustomZoneName] = useState("");
  const [customZoneRate, setCustomZoneRate] = useState("");
  const [customZoneDays, setCustomZoneDays] = useState("3-5 Days");

  const [team,          setTeam]          = useState<TeamMember[]>([]);
  const [initialTeam,   setInitialTeam]   = useState<TeamMember[]>([]);
  const [teamDirty,     setTeamDirty]     = useState(false);

  const [notifs,        setNotifs]        = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [notifsDirty,   setNotifsDirty]   = useState(false);

  const [security,      setSecurity]      = useState<SecuritySettings>(DEFAULT_SECURITY);
  const [showPwd,       setShowPwd]       = useState(false);
  const [showMemberPwds, setShowMemberPwds] = useState<Record<string, boolean>>({});

  // ── Loading state ─────────────────────────────────
  const [loading, setLoading] = useState(true);

  // ── Errors ────────────────────────────────────────
  const [storeErrors,   setStoreErrors]   = useState<Partial<Record<keyof StoreInfo, string>>>({});
  const [secErrors,     setSecErrors]     = useState<Partial<Record<keyof SecuritySettings, string>>>({});

  // ── Fetch settings and team ───────────────────────
  const fetchSettings = useCallback(async () => {
    try {
      const settingsData = await adminService.getSettings();
      if (settingsData) {
        if (settingsData.store) {
          setStore(settingsData.store);
        }
        if (settingsData.payment) {
          setPayment({
            stripeEnabled: settingsData.payment.stripeEnabled ?? false,
            stripeKey: settingsData.payment.stripeKeyMasked ?? "",
            paypalEnabled: settingsData.payment.paypalEnabled ?? false,
            paypalClientId: settingsData.payment.paypalClientIdMasked ?? "",
            cashOnDelivery: settingsData.payment.cashOnDelivery ?? true,
            testMode: settingsData.payment.testMode ?? true,
          });
        }
        if (settingsData.shipping) {
          setShipping({
            freeShippingThreshold: String(settingsData.shipping.freeShippingThreshold ?? 500),
            locations: settingsData.shipping.locations ?? [],
            processingDays: String(settingsData.shipping.processingDays ?? 1),
          });
        }
        if (settingsData.notifications) {
          setNotifs(settingsData.notifications);
        }
        if (settingsData.security) {
          setSecurity((s) => ({
            ...s,
            twoFactorEnabled: settingsData.security.twoFactorEnabled ?? false,
            sessionTimeout: String(settingsData.security.sessionTimeout ?? 60),
          }));
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load store settings.");
    }
  }, []);

  const fetchTeam = useCallback(async () => {
    if (!isOwner) return;
    try {
      const teamData = await adminService.getTeam();
      const mappedTeam = teamData.map((m: any) => ({
        id: m.id || m._id,
        name: m.name,
        email: m.email,
        password: "••••••••",
        role: m.role ? ((m.role.charAt(0).toUpperCase() + m.role.slice(1)) as "Admin" | "Editor" | "Viewer") : "Viewer",
      }));
      setTeam(mappedTeam);
      setInitialTeam(mappedTeam);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load team members.");
    }
  }, [isOwner]);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchTeam()]);
      setLoading(false);
    };
    initData();
  }, [fetchSettings, fetchTeam]);

  // ── Nav click with unsaved changes guard ──────────
  const dirtyMap = isOwner 
    ? [storeDirty, paymentDirty, shippingDirty, teamDirty, notifsDirty, false]
    : [storeDirty, paymentDirty, shippingDirty, notifsDirty, false];
    
  const handleNav = (i: number) => {
    if (dirtyMap[active] && i !== active) {
      if (!window.confirm("You have unsaved changes. Leave without saving?")) return;
    }
    setActive(i);
  };

  // ── Store helpers ─────────────────────────────────
  const updateStore = useCallback(<K extends keyof StoreInfo>(key: K, val: StoreInfo[K]) => {
    setStore((s) => ({ ...s, [key]: val }));
    setStoreDirty(true);
    setStoreErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  const updateStorePref = (key: keyof StoreInfo["prefs"], val: boolean) => {
    setStore((s) => ({ ...s, prefs: { ...s.prefs, [key]: val } }));
    setStoreDirty(true);
  };

  const validateStore = (): boolean => {
    const errs: Partial<Record<keyof StoreInfo, string>> = {};
    if (!store.storeName?.trim())           errs.storeName    = "Store name is required";
    if (!isValidEmail(store.storeEmail))   errs.storeEmail   = "Invalid email address";
    if (!isValidPhone(store.storePhone))   errs.storePhone   = "Invalid phone number";
    if (!isValidUrl(store.storeUrl))       errs.storeUrl     = "Invalid URL";
    if (!store.storeAddress?.trim())        errs.storeAddress = "Address is required";
    setStoreErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveStore = async () => {
    if (!validateStore()) { toast.error("Please fix the errors before saving"); return; }
    try {
      await adminService.updateStoreSettings(store);
      setStoreDirty(false);
      toast.success("Store settings saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save store settings.");
    }
  };

  const cancelStore = async () => {
    if (!window.confirm("Discard unsaved changes?")) return;
    setLoading(true);
    await fetchSettings();
    setStoreErrors({});
    setStoreDirty(false);
    setLoading(false);
  };

  // ── Payment helpers ───────────────────────────────
  const updatePayment = <K extends keyof PaymentSettings>(key: K, val: PaymentSettings[K]) => {
    setPayment((p) => ({ ...p, [key]: val }));
    setPaymentDirty(true);
  };

  const savePayment = async () => {
    if (payment.stripeEnabled && !payment.stripeKey.trim()) {
      toast.error("Stripe secret key is required when Stripe is enabled");
      return;
    }
    if (payment.paypalEnabled && !payment.paypalClientId.trim()) {
      toast.error("PayPal Client ID is required when PayPal is enabled");
      return;
    }

    try {
      const payload: any = {
        stripeEnabled: payment.stripeEnabled,
        paypalEnabled: payment.paypalEnabled,
        cashOnDelivery: payment.cashOnDelivery,
        testMode: payment.testMode,
      };
      if (payment.stripeKey && !payment.stripeKey.includes("••••")) {
        payload.stripeKey = payment.stripeKey;
      }
      if (payment.paypalClientId && !payment.paypalClientId.includes("••••")) {
        payload.paypalClientId = payment.paypalClientId;
      }

      await adminService.updatePaymentSettings(payload);
      setPaymentDirty(false);
      toast.success("Payment settings saved!");
      await fetchSettings(); // reload to get updated masked keys
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save payment settings.");
    }
  };

  // ── Shipping helpers ──────────────────────────────
  const updateShipping = <K extends keyof ShippingSettings>(key: K, val: ShippingSettings[K]) => {
    setShipping((s) => ({ ...s, [key]: val }));
    setShippingDirty(true);
  };

  const updateShippingLocation = (id: string, key: keyof ShippingLocation, val: string | number) => {
    setShipping((s) => ({
      ...s,
      locations: s.locations.map((loc) => loc.id === id ? { ...loc, [key]: val } : loc),
    }));
    setShippingDirty(true);
  };

  const saveShipping = async () => {
    const hasInvalid = shipping.locations.some((loc) => !loc.city.trim() || loc.rate < 0 || !loc.deliveryDays.trim());
    if (hasInvalid) {
      toast.error("All locations must have a city, rate, and delivery days");
      return;
    }
    try {
      const payload = {
        freeShippingThreshold: parseFloat(shipping.freeShippingThreshold) || 0,
        processingDays: parseInt(shipping.processingDays) || 1,
        locations: shipping.locations.map((loc) => ({
          id: loc.id,
          city: loc.city,
          rate: loc.rate,
          deliveryDays: loc.deliveryDays,
          isCustom: loc.isCustom || false,
        })),
      };
      await adminService.updateShippingSettings(payload);
      await fetchSettings(); // reload to sync real DB ids for newly-added custom zones
      setShippingDirty(false);
      toast.success("Shipping settings saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save shipping settings.");
    }
  };

  // ── Custom Shipping Zone helpers ──────────────────
  const addCustomShippingZone = () => {
    if (!customZoneName.trim()) {
      toast.error("Please enter a custom location name");
      return;
    }
    if (!customZoneRate || parseFloat(customZoneRate) < 0) {
      toast.error("Please enter a valid shipping rate");
      return;
    }
    const newZone: ShippingLocation = {
      id: crypto.randomUUID(),
      city: customZoneName,
      rate: parseFloat(customZoneRate),
      deliveryDays: customZoneDays,
      isCustom: true,
    };
    setShipping((s) => ({
      ...s,
      locations: [...s.locations, newZone],
    }));
    setShippingDirty(true);
    setCustomZoneName("");
    setCustomZoneRate("");
    setCustomZoneDays("3-5 Days");
    toast.success("Custom shipping zone added!");
  };

  const removeCustomZone = (id: string) => {
    const zone = shipping.locations.find((loc) => loc.id === id);
    if (!zone?.isCustom) {
      toast.error("Cannot delete default governorate zones");
      return;
    }
    setShipping((s) => ({
      ...s,
      locations: s.locations.filter((loc) => loc.id !== id),
    }));
    setShippingDirty(true);
    toast.success("Custom zone removed!");
  };

  // ── Team helpers ──────────────────────────────────
  const addMember = () => {
    if (!isOwner) {
      toast.error("Only the store owner can add team members");
      return;
    }
    setTeam((t) => [...t, { id: crypto.randomUUID(), name: "", email: "", password: "", role: "Viewer" }]);
    setTeamDirty(true);
  };

  const updateMember = (id: string, key: keyof TeamMember, val: string) => {
    if (!isOwner) return;
    setTeam((t) => t.map((m) => m.id === id ? { ...m, [key]: val } : m));
    setTeamDirty(true);
  };

  const removeMember = (id: string) => {
    if (!isOwner) {
      toast.error("Only the store owner can remove team members");
      return;
    }
    if (team.length === 1) {
      toast.error("At least one admin is required");
      return;
    }
    setTeam((t) => t.filter((m) => m.id !== id));
    setTeamDirty(true);
  };

  const saveTeam = async () => {
    if (!isOwner) {
      toast.error("Only the store owner can manage team members");
      return;
    }
    const invalid = team.some((m) => !m.name.trim() || !isValidEmail(m.email) || !m.password.trim());
    if (invalid) {
      toast.error("All team members need a name, valid email, and password");
      return;
    }

    setLoading(true);
    try {
      // 1. Identify deleted members
      const deleted = initialTeam.filter((init) => !team.some((curr) => curr.id === init.id));
      for (const d of deleted) {
        await adminService.deleteTeamMember(d.id);
      }

      // 2. Add or update members
      for (const member of team) {
        const isNew = !initialTeam.some((init) => init.id === member.id);
        if (isNew) {
          await adminService.addTeamMember({
            name: member.name,
            email: member.email,
            password: member.password,
            role: member.role.toLowerCase(),
          });
        } else {
          // Check for edits
          const initial = initialTeam.find((init) => init.id === member.id);
          const hasChanges = initial && (
            initial.name !== member.name ||
            initial.email !== member.email ||
            initial.role !== member.role ||
            (member.password !== "••••••••" && member.password !== initial.password)
          );
          if (hasChanges) {
            const payload: any = {
              name: member.name,
              email: member.email,
              role: member.role.toLowerCase(),
            };
            if (member.password !== "••••••••") {
              payload.password = member.password;
            }
            await adminService.updateTeamMember(member.id, payload);
          }
        }
      }

      toast.success("Team settings saved!");
      setTeamDirty(false);
      await fetchTeam();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save team settings.");
    } finally {
      setLoading(false);
    }
  };

  const cancelTeam = () => {
    if (!window.confirm("Discard unsaved changes?")) return;
    setTeam(initialTeam);
    setTeamDirty(false);
  };

  // ── Notification helpers ──────────────────────────
  const updateNotif = <K extends keyof NotificationSettings>(key: K, val: NotificationSettings[K]) => {
    setNotifs((n) => ({ ...n, [key]: val }));
    setNotifsDirty(true);
  };

  const saveNotifs = async () => {
    if (!isValidEmail(notifs.emailRecipient)) { toast.error("Invalid recipient email"); return; }
    try {
      await adminService.updateNotificationSettings(notifs);
      setNotifsDirty(false);
      toast.success("Notification settings saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save notification settings.");
    }
  };

  // ── Security helpers ──────────────────────────────
  const updateSecurity = <K extends keyof SecuritySettings>(key: K, val: SecuritySettings[K]) => {
    setSecurity((s) => ({ ...s, [key]: val }));
    setSecErrors((e) => ({ ...e, [key]: undefined }));
  };

  const saveSecurity = async () => {
    const errs: Partial<Record<keyof SecuritySettings, string>> = {};
    if (!security.currentPassword)                          errs.currentPassword = "Current password is required";
    if (security.newPassword.length < 8)                   errs.newPassword     = "Minimum 8 characters";
    if (security.newPassword !== security.confirmPassword)  errs.confirmPassword = "Passwords do not match";
    setSecErrors(errs);
    if (Object.keys(errs).length > 0) { toast.error("Please fix the errors"); return; }

    try {
      await adminService.changePassword({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
        confirmNewPassword: security.confirmPassword,
      });
      setSecurity(DEFAULT_SECURITY);
      toast.success("Password updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update password.");
    }
  };

  const handleToggle2FA = async (v: boolean) => {
    try {
      await adminService.update2FA(v);
      updateSecurity("twoFactorEnabled", v);
      toast.success(v ? "2FA enabled" : "2FA disabled");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update 2FA setting.");
    }
  };

  const handleSessionTimeoutChange = async (val: string) => {
    try {
      await adminService.updateSessionTimeout(parseInt(val) || 60);
      updateSecurity("sessionTimeout", val);
      toast.success("Session timeout updated.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update session timeout.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-[#dc143c] mb-4" />
        <p className="text-lg">Loading settings configuration...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your store configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <nav className="lg:col-span-1 space-y-1">
          {NAV.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleNav(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                  active === i
                    ? "bg-[#dc143c] text-white"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm flex-1">{item.label}</span>
                {dirtyMap[i] && <UnsavedDot />}
              </motion.button>
            );
          })}
        </nav>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="lg:col-span-3 bg-[#1e1e24] border border-white/5 rounded-xl p-6"
          >

            {/* ── 0: Store Information ── */}
            {active === 0 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-extrabold">Store Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="storeName" label="Store Name *" error={storeErrors.storeName}>
                    <Input id="storeName" value={store.storeName || ""}
                      onChange={(e) => updateStore("storeName", e.target.value)} className="bg-black/20 border-white/10 text-white" />
                  </Field>
                  <Field id="storeUrl" label="Store URL *" error={storeErrors.storeUrl}>
                    <Input id="storeUrl" value={store.storeUrl || ""}
                      onChange={(e) => updateStore("storeUrl", e.target.value)} className="bg-black/20 border-white/10 text-white" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="storeEmail" label="Store Email *" error={storeErrors.storeEmail}>
                    <Input id="storeEmail" type="email" value={store.storeEmail || ""}
                      onChange={(e) => updateStore("storeEmail", e.target.value)} className="bg-black/20 border-white/10 text-white" />
                  </Field>
                  <Field id="storePhone" label="Store Phone *" error={storeErrors.storePhone}>
                    <Input id="storePhone" type="tel" value={store.storePhone || ""}
                      onChange={(e) => updateStore("storePhone", e.target.value)} className="bg-black/20 border-white/10 text-white" />
                  </Field>
                </div>

                <Field id="storeAddress" label="Store Address *" error={storeErrors.storeAddress}>
                  <Input id="storeAddress" value={store.storeAddress || ""}
                    onChange={(e) => updateStore("storeAddress", e.target.value)} className="bg-black/20 border-white/10 text-white" />
                </Field>

                <Separator className="border-white/5" />

                <h3 className="text-lg font-semibold">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="taxId" label="Tax ID / EIN">
                    <Input id="taxId" value={store.taxId || ""}
                      onChange={(e) => updateStore("taxId", e.target.value)} className="bg-black/20 border-white/10 text-white" />
                  </Field>
                  <Field id="bizType" label="Business Type">
                    <Input id="bizType" value={store.bizType || ""}
                      onChange={(e) => updateStore("bizType", e.target.value)} className="bg-black/20 border-white/10 text-white" />
                  </Field>
                </div>

                <Separator className="border-white/5" />

                <h3 className="text-lg font-semibold">Regional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field id="currency" label="Currency">
                    <select id="currency" value={store.currency || "EGP"}
                      onChange={(e) => updateStore("currency", e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-sm text-white outline-none focus:border-[#dc143c]">
                      {["USD", "EUR", "GBP", "EGP", "AED", "SAR"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field id="language" label="Language">
                    <select id="language" value={store.language || "English"}
                      onChange={(e) => updateStore("language", e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-sm text-white outline-none focus:border-[#dc143c]">
                      {["English", "Arabic", "French", "Spanish"].map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </Field>
                  <Field id="timezone" label="Timezone">
                    <select id="timezone" value={store.timezone || "Africa/Cairo"}
                      onChange={(e) => updateStore("timezone", e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-sm text-white outline-none focus:border-[#dc143c]">
                      {["America/New_York", "Europe/London", "Africa/Cairo", "Asia/Dubai"].map((tz) => <option key={tz}>{tz}</option>)}
                    </select>
                  </Field>
                </div>

                <Separator className="border-white/5" />

                <h3 className="text-lg font-semibold">Store Preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      { key: "enableReviews", label: "Enable customer reviews" },
                      { key: "guestCheckout", label: "Allow guest checkout" },
                      { key: "orderEmails",   label: "Send order confirmation emails" },
                      { key: "newsletter",    label: "Enable newsletter signup" },
                      { key: "showOutOfStock", label: "Show out of stock products" },
                      { key: "maintenanceMode", label: "Enable maintenance mode" },
                    ] as { key: keyof StoreInfo["prefs"]; label: string }[]
                  ).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <Toggle checked={!!store.prefs?.[key]} onChange={(v) => updateStorePref(key, v)} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>

                <SaveBar onSave={saveStore} onCancel={cancelStore} dirty={storeDirty} />
              </div>
            )}

            {/* ── 1: Payment Settings ── */}
            {active === 1 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-extrabold">Payment Settings</h2>

                {/* Test Mode Banner */}
                {payment.testMode && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>Test mode is <strong>ON</strong> — no real charges will be made.</span>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <Toggle checked={payment.testMode} onChange={(v) => updatePayment("testMode", v)} />
                  <span className="text-sm font-medium">Test / Sandbox Mode</span>
                </label>

                <Separator className="border-white/5" />

                {/* Stripe */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Stripe</h3>
                    <Toggle checked={payment.stripeEnabled} onChange={(v) => updatePayment("stripeEnabled", v)} />
                  </div>
                  {payment.stripeEnabled && (
                    <Field id="stripeKey" label="Stripe Secret Key">
                      <Input id="stripeKey" type="password" value={payment.stripeKey}
                        placeholder="sk_test_..." onChange={(e) => updatePayment("stripeKey", e.target.value)}
                        className="bg-black/20 border-white/10 text-white font-mono text-xs" />
                    </Field>
                  )}
                </div>

                <Separator className="border-white/5" />

                {/* PayPal */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">PayPal</h3>
                    <Toggle checked={payment.paypalEnabled} onChange={(v) => updatePayment("paypalEnabled", v)} />
                  </div>
                  {payment.paypalEnabled && (
                    <Field id="paypalId" label="PayPal Client ID">
                      <Input id="paypalId" value={payment.paypalClientId}
                        placeholder="AaBbCc..." onChange={(e) => updatePayment("paypalClientId", e.target.value)}
                        className="bg-black/20 border-white/10 text-white font-mono text-xs" />
                    </Field>
                  )}
                </div>

                <Separator className="border-white/5" />

                {/* Cash on Delivery */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Cash on Delivery (COD)</p>
                    <p className="text-xs text-muted-foreground">Customer pays when order arrives</p>
                  </div>
                  <Toggle checked={payment.cashOnDelivery} onChange={(v) => updatePayment("cashOnDelivery", v)} />
                </div>

                <SaveBar onSave={savePayment} dirty={paymentDirty} />
              </div>
            )}

            {/* ── 2: Shipping Settings ── */}
            {active === 2 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-extrabold">Shipping Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="freeThreshold" label="Free Shipping Threshold (EGP)">
                    <Input id="freeThreshold" type="number" min="0" value={shipping.freeShippingThreshold}
                      onChange={(e) => updateShipping("freeShippingThreshold", e.target.value)}
                      className="bg-black/20 border-white/10 text-white" />
                  </Field>
                  <Field id="processingDays" label="Processing Days">
                    <Input id="processingDays" type="number" min="1" value={shipping.processingDays}
                      onChange={(e) => updateShipping("processingDays", e.target.value)}
                      className="bg-black/20 border-white/10 text-white" />
                  </Field>
                </div>

                <Separator className="border-white/5" />
                <h3 className="font-semibold text-lg">Egypt Governorates Shipping Rates</h3>
                <p className="text-xs text-muted-foreground">Edit shipping rates and delivery days for each governorate. Governorate names are fixed and cannot be modified.</p>

                {/* Governorates Table */}
                <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-black/30 border-b border-white/5">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-white">Governorate</th>
                          <th className="px-4 py-3 text-left font-semibold text-white">Shipping Rate (EGP)</th>
                          <th className="px-4 py-3 text-left font-semibold text-white">Delivery Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipping.locations.filter((loc) => !loc.isCustom).map((location) => (
                          <tr key={location.id} className="border-b border-white/5 hover:bg-black/10 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{location.city}</td>
                            <td className="px-4 py-3">
                              <Input type="number" min="0" step="0.01" value={location.rate}
                                onChange={(e) => updateShippingLocation(location.id, "rate", parseFloat(e.target.value) || 0)}
                                className="bg-black/20 border-white/10 text-white w-24" />
                            </td>
                            <td className="px-4 py-3">
                              <Input value={location.deliveryDays}
                                onChange={(e) => updateShippingLocation(location.id, "deliveryDays", e.target.value)}
                                className="bg-black/20 border-white/10 text-white w-32" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Custom Zones Section */}
                {shipping.locations.filter((loc) => loc.isCustom).length > 0 && (
                  <>
                    <Separator className="border-white/5" />
                    <h3 className="font-semibold text-lg">Custom Shipping Zones</h3>
                    <div className="space-y-2">
                      {shipping.locations.filter((loc) => loc.isCustom).map((location) => (
                        <div key={location.id} className="bg-black/20 border border-white/5 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div>
                            <Label className="text-xs text-muted-foreground">Location Name</Label>
                            <p className="text-white font-medium">{location.city}</p>
                          </div>
                          <Field id={`custom-rate-${location.id}`} label="Shipping Rate (EGP)">
                            <Input type="number" min="0" step="0.01" value={location.rate}
                              onChange={(e) => updateShippingLocation(location.id, "rate", parseFloat(e.target.value) || 0)}
                              className="bg-black/20 border-white/10 text-white" />
                          </Field>
                          <Field id={`custom-days-${location.id}`} label="Delivery Days">
                            <Input value={location.deliveryDays}
                              onChange={(e) => updateShippingLocation(location.id, "deliveryDays", e.target.value)}
                              className="bg-black/20 border-white/10 text-white" />
                          </Field>
                          <Button variant="ghost" size="icon"
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => removeCustomZone(location.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Add Custom Zone Form */}
                <Separator className="border-white/5" />
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <h3 className="font-semibold text-lg mb-4">Add Custom Shipping Zone</h3>
                  <p className="text-xs text-muted-foreground mb-4">Create custom zones for specific sub-districts, compounds, or regions not in the standard list.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Field id="customZoneName" label="Location Name">
                      <Input id="customZoneName" value={customZoneName} placeholder="e.g., New Cairo, 6th of October City"
                        onChange={(e) => setCustomZoneName(e.target.value)}
                        className="bg-black/30 border-white/10 text-white" />
                    </Field>
                    <Field id="customZoneRate" label="Shipping Rate (EGP)">
                      <Input id="customZoneRate" type="number" min="0" step="0.01" value={customZoneRate}
                        placeholder="0.00" onChange={(e) => setCustomZoneRate(e.target.value)}
                        className="bg-black/30 border-white/10 text-white" />
                    </Field>
                    <Field id="customZoneDays" label="Delivery Days">
                      <select value={customZoneDays}
                        onChange={(e) => setCustomZoneDays(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md text-sm text-white outline-none focus:border-[#dc143c]">
                        <option>1-2 Days</option>
                        <option>2-3 Days</option>
                        <option>3-4 Days</option>
                        <option>3-5 Days</option>
                        <option>5-7 Days</option>
                        <option>1 Week</option>
                        <option>2 Weeks</option>
                      </select>
                    </Field>
                  </div>
                  
                  <Button onClick={addCustomShippingZone} className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Custom Zone
                  </Button>
                </div>

                <SaveBar onSave={saveShipping} dirty={shippingDirty} />
              </div>
            )}

            {/* ── 3: Team & Permissions ── */}
            {active === 3 && (
              <div className="space-y-5">
                {!isOwner ? (
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Access Denied</p>
                      <p className="text-xs mt-1">Only the Store Owner ({OWNER_EMAIL}) can manage team members and permissions.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-extrabold">Team & Permissions</h2>
                      <Button onClick={addMember} size="sm" className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white">
                        <Plus className="w-4 h-4 mr-1" /> Add Member
                      </Button>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-400 text-xs">
                      <p><strong>Credentials Flow:</strong> Credentials entered here will be processed locally. An automated onboarding notification containing the configured Email and Password will be sent to the new administrator upon account approval.</p>
                    </div>

                    <div className="space-y-3">
                      {team.map((member) => (
                        <div key={member.id} className="bg-black/20 border border-white/5 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                          <Field id={`name-${member.id}`} label="Name">
                            <Input value={member.name} placeholder="Full name"
                              onChange={(e) => updateMember(member.id, "name", e.target.value)}
                              className="bg-black/20 border-white/10 text-white" />
                          </Field>
                          <Field id={`email-${member.id}`} label="Email">
                            <Input value={member.email} placeholder="email@example.com" type="email"
                              onChange={(e) => updateMember(member.id, "email", e.target.value)}
                              className="bg-black/20 border-white/10 text-white" />
                          </Field>
                          <Field id={`password-${member.id}`} label="Password">
                            <div className="relative">
                              <Input value={member.password} placeholder="Enter password" type={showMemberPwds[member.id] ? "text" : "password"}
                                onChange={(e) => updateMember(member.id, "password", e.target.value)}
                                className="bg-black/20 border-white/10 text-white pr-10" />
                              <button onClick={() => setShowMemberPwds((s) => ({ ...s, [member.id]: !s[member.id] }))}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-white transition-colors">
                                {showMemberPwds[member.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </Field>
                          <div className="flex-1">
                            <Label>Role</Label>
                            <select value={member.role}
                              onChange={(e) => updateMember(member.id, "role", e.target.value as any)}
                              className="w-full mt-1 px-3 py-2 bg-black/20 border border-white/10 rounded-md text-sm text-white outline-none focus:border-[#dc143c]">
                              {["Admin", "Editor", "Viewer"].map((r) => <option key={r}>{r}</option>)}
                            </select>
                          </div>
                          <div className="flex-shrink-0">
                            <Button variant="ghost" size="icon"
                              className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                              onClick={() => removeMember(member.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Role legend */}
                    <div className="bg-black/20 rounded-xl p-4 text-xs space-y-1 text-muted-foreground border border-white/5">
                      <p><span className="text-white font-semibold">Admin</span> — Full access: products, orders, settings, team</p>
                      <p><span className="text-white font-semibold">Editor</span> — Can manage products and orders, no settings access</p>
                      <p><span className="text-white font-semibold">Viewer</span> — Read-only access to dashboard and analytics</p>
                    </div>

                    <SaveBar onSave={saveTeam} onCancel={cancelTeam} dirty={teamDirty} />
                  </>
                )}
              </div>
            )}

            {/* ── 4: Notifications ── */}
            {active === 4 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-extrabold">Notifications</h2>

                <Field id="emailRecipient" label="Notification Email">
                  <Input id="emailRecipient" type="email" value={notifs.emailRecipient || ""}
                    onChange={(e) => updateNotif("emailRecipient", e.target.value)}
                    className="bg-black/20 border-white/10 text-white" />
                </Field>

                <Separator className="border-white/5" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Alert Events</h3>

                <div className="space-y-3">
                  {(
                    [
                      { key: "newOrder",     label: "New order placed",         desc: "Get notified whenever a customer places an order" },
                      { key: "lowStock",     label: "Low stock alert",           desc: "Alert when a product drops to 5 units or below" },
                      { key: "newReview",    label: "New customer review",       desc: "Get notified when a review is submitted" },
                      { key: "newCustomer",  label: "New customer registered",   desc: "Alert when a new account is created" },
                    ] as { key: keyof NotificationSettings; label: string; desc: string }[]
                  ).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-4">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Toggle checked={!!notifs[key]} onChange={(v) => updateNotif(key, v)} />
                    </div>
                  ))}
                </div>

                <Separator className="border-white/5" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Report Emails</h3>

                <div className="space-y-3">
                  {(
                    [
                      { key: "dailyReport",  label: "Daily Summary",  desc: "Receive a daily performance report each morning" },
                      { key: "weeklyReport", label: "Weekly Report",  desc: "Receive a weekly analytics digest every Monday" },
                    ] as { key: keyof NotificationSettings; label: string; desc: string }[]
                  ).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-4">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Toggle checked={!!notifs[key]} onChange={(v) => updateNotif(key, v)} />
                    </div>
                  ))}
                </div>

                <SaveBar onSave={saveNotifs} dirty={notifsDirty} />
              </div>
            )}

            {/* ── 5: Security ── */}
            {active === 5 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-extrabold">Security</h2>

                <h3 className="font-semibold">Change Password</h3>
                <div className="space-y-4">
                  <Field id="currentPwd" label="Current Password" error={secErrors.currentPassword}>
                    <div className="relative">
                      <Input id="currentPwd" type={showPwd ? "text" : "password"}
                        value={security.currentPassword}
                        onChange={(e) => updateSecurity("currentPassword", e.target.value)}
                        className="bg-black/20 border-white/10 text-white pr-10" />
                      <button onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-white transition-colors">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field id="newPwd" label="New Password" error={secErrors.newPassword}>
                    <Input id="newPwd" type="password" value={security.newPassword}
                      onChange={(e) => updateSecurity("newPassword", e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="bg-black/20 border-white/10 text-white" />
                  </Field>

                  <Field id="confirmPwd" label="Confirm New Password" error={secErrors.confirmPassword}>
                    <Input id="confirmPwd" type="password" value={security.confirmPassword}
                      onChange={(e) => updateSecurity("confirmPassword", e.target.value)}
                      className="bg-black/20 border-white/10 text-white" />
                  </Field>

                  {/* Password strength indicator */}
                  {security.newPassword.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                            security.newPassword.length >= i * 3
                              ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-amber-500" : i <= 3 ? "bg-yellow-400" : "bg-green-500"
                              : "bg-white/10"
                          }`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {security.newPassword.length < 4 ? "Too short" :
                         security.newPassword.length < 7 ? "Weak" :
                         security.newPassword.length < 10 ? "Fair" : "Strong"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button onClick={saveSecurity} className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white">
                    <Check className="w-4 h-4 mr-2" /> Update Password
                  </Button>
                </div>

                <Separator className="border-white/5" />

                {/* 2FA */}
                <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-4">
                  <div>
                    <p className="font-semibold text-sm">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Toggle checked={security.twoFactorEnabled}
                    onChange={handleToggle2FA} />
                </div>

                {/* Session timeout */}
                <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-4">
                  <div>
                    <p className="font-semibold text-sm">Session Timeout</p>
                    <p className="text-xs text-muted-foreground">Automatically log out after inactivity</p>
                  </div>
                  <select value={security.sessionTimeout}
                    onChange={(e) => handleSessionTimeoutChange(e.target.value)}
                    className="bg-black/30 border border-white/10 text-white text-sm rounded-md px-3 py-2 outline-none focus:border-[#dc143c]">
                    {[
                      { val: "30",  label: "30 minutes" },
                      { val: "60",  label: "1 hour" },
                      { val: "240", label: "4 hours" },
                      { val: "480", label: "8 hours" },
                    ].map(({ val, label }) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}