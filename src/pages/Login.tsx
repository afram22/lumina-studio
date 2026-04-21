import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/dashboard");
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate("/dashboard");
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Chronos Agent workspace.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none border border-white/10 focus:border-white/30 transition"
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none border border-white/10 focus:border-white/30 transition"
            placeholder="••••••••"
          />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black py-3 font-medium text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowUpRight className="h-4 w-4" /></>}
        </motion.button>
      </form>
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[11px] uppercase tracking-wider text-white/40 font-body">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <button
        type="button"
        onClick={onGoogle}
        disabled={googleLoading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white py-3 font-medium text-sm disabled:opacity-60"
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><GoogleIcon /> Continue with Google</>}
      </button>
      <p className="mt-6 text-sm text-white/60 text-center">
        New here?{" "}
        <Link to="/signup" className="text-white underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.4 4.5 9.8 8.7 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9C28.9 35 26.6 36 24 36c-5.3 0-9.7-2.9-11.3-7l-6.5 5C9.7 39.3 16.3 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6 4.9C40.9 34.6 43.5 30 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6 py-12">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 20%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(50% 40% at 80% 80%, rgba(217,70,239,0.18), transparent 60%), #000",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6 }}
        className="liquid-glass rounded-3xl p-8 md:p-10 w-full max-w-md"
      >
        <Link to="/" className="text-white/60 hover:text-white text-xs font-body relative z-[1]">
          ← Back to site
        </Link>
        <h1 className="mt-6 text-4xl font-heading italic text-white relative z-[1]">{title}</h1>
        <p className="mt-2 text-white/60 text-sm font-body relative z-[1]">{subtitle}</p>
        <div className="mt-8 relative z-[1]">{children}</div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-white/50 mb-2 font-body">{label}</span>
      {children}
    </label>
  );
}

export default LoginPage;
