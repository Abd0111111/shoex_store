import { Link } from "react-router-dom";
import { useState } from "react";

// ─── Social Icon Types ──────────────────────────────────────────────────────────
interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const Instagram = ({ size = 24, ...props }: SocialIconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Facebook = ({ size = 24, ...props }: SocialIconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// TikTok icon (not in lucide — custom SVG)
const TikTok = ({ size = 24, ...props }: SocialIconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="currentColor" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5
      2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0
      0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0
      6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

// ─── Constants ──────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "201061885624";
const WHATSAPP_URL    = `https://wa.me/${WHATSAPP_NUMBER}`;

const SOCIAL_LINKS = [
  {
    icon: Instagram,
    href:  "https://www.instagram.com/shoex_st0re?igsh=MWdkcTY0czVja3FicQ%3D%3D&utm_source=qr",
    label: "Instagram",
  },
  {
    icon: Facebook,
    href:  "https://www.facebook.com/share/1HK2aJUbCx/?mibextid=wwXIfr",
    label: "Facebook",
  },
  {
    icon: TikTok,
    href:  "https://www.tiktok.com/@shoex_store?_r=1&_t=ZS-96zbZai3xVy",
    label: "TikTok",
  },
];

const SHOP_LINKS = [
  { label: "All Sneakers",    path: "/shop" },
  { label: "New Arrivals",    path: "/shop" },
  { label: "Trending",        path: "/shop" },
  { label: "Limited Edition", path: "/shop" },
];

const SUPPORT_LINKS = [
  // TODO: create /size-guide page
  { label: "Size Guide",   path: "#",        external: false },
  // TODO: create /shipping page
  { label: "Shipping Info", path: "#",       external: false },
  // TODO: create /returns page
  { label: "Returns",      path: "#",        external: false },
  // Opens WhatsApp chat with store number
  { label: "Contact Us",   path: WHATSAPP_URL, external: true  },
];

// ─── Component ──────────────────────────────────────────────────────────────────
export default function Footer() {
  const [email,  setEmail]  = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoinNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // TODO: connect to newsletter API — POST /api/newsletter/subscribe
      setJoined(true);
      setEmail("");
      setTimeout(() => setJoined(false), 5000);
    }
  };

  return (
    <footer className="bg-[#0d0d0d] text-[#888] border-t border-[#1a1a1a] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link to="/" className="flex items-center gap-2 group mb-5">
              <div className="w-8 h-8 bg-[#e63946] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <span className="text-xl font-black tracking-tight text-white">SHOEX</span>
            </Link>
            <p className="text-sm leading-relaxed text-[#888] mb-6 max-w-sm">
              Modern sneaker culture meets premium digital experience.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#161619] border border-[#2a2a2a] text-[#888] hover:text-white hover:bg-[#e63946] hover:border-[#e63946] transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Column */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black uppercase text-sm tracking-wider mb-5">Shop</h4>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-sm font-medium text-[#888] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black uppercase text-sm tracking-wider mb-5">Support</h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) =>
                link.external ? (
                  <li key={link.label}>
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#888] hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    {/* TODO: replace # with real page path when page is created */}
                    <span className="text-sm font-medium text-[#555] cursor-not-allowed select-none">
                      {link.label}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <h4 className="text-white font-black uppercase text-sm tracking-wider mb-5">Newsletter</h4>
            <p className="text-sm text-[#888] mb-5 leading-relaxed">
              Get exclusive drops and early access.
            </p>
            <form onSubmit={handleJoinNewsletter} className="flex items-stretch w-full max-w-sm gap-2">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-[#161619] border border-[#2a2a2a] text-white placeholder-[#555] text-sm outline-none focus:border-[#e63946] focus:shadow-[0_0_12px_rgba(230,57,70,0.1)] transition-all duration-300"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-[#e63946] hover:bg-[#c1121f] text-white font-bold text-sm rounded-xl tracking-wide transition-all duration-300 active:scale-95 flex-shrink-0"
              >
                {joined ? "Joined ✓" : "Join"}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1a1a1a] pt-8 flex items-center justify-center">
          <p className="text-xs font-semibold text-[#555] tracking-wide">
            © 2026 SHOEX Store. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}