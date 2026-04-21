import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "./Login";

function SignupPage() {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <AuthShell title="Create your account" subtitle="Start turning meetings into outcomes.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-white/50 mb-2 font-body">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none border border-white/10 focus:border-white/30 transition"
            placeholder="you@company.com"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-white/50 mb-2 font-body">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none border border-white/10 focus:border-white/30 transition"
            placeholder="At least 6 characters"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black py-3 font-medium text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowUpRight className="h-4 w-4" /></>}
        </motion.button>
      </form>
      <p className="mt-6 text-sm text-white/60 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-white underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default SignupPage;
