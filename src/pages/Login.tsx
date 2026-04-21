import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
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
      <p className="mt-6 text-sm text-white/60 text-center">
        New here?{" "}
        <Link to="/signup" className="text-white underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthShell>
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
