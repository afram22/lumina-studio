import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  FileAudio,
  Calendar,
  Clock,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  action_items: { title: string }[] | null;
};

function HistoryPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("meetings")
      .select("id,title,status,created_at,action_items")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filtered = rows.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 40% at 15% 10%, rgba(99,102,241,0.22), transparent 60%), radial-gradient(45% 35% at 85% 90%, rgba(217,70,239,0.16), transparent 60%), #050507",
        }}
      />

      <NavBar email={user?.email} onSignOut={handleSignOut} active="History" />

      <div className="px-6 lg:px-10 pb-32 pt-4 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
            Meeting history
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/60 font-body font-light">
            Every meeting Chronos has analyzed, documented, and acted upon.
          </p>
        </motion.div>

        <div className="liquid-glass rounded-full px-4 py-3 flex items-center gap-3 mb-6 relative z-[1]">
          <Search className="h-4 w-4 text-white/50 relative z-10" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings..."
            className="bg-transparent outline-none text-sm text-white placeholder:text-white/40 flex-1 relative z-10 font-body"
          />
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 && (
            <div className="liquid-glass rounded-2xl p-12 text-center">
              <p className="text-white/60 font-body relative z-[1]">No meetings found.</p>
            </div>
          )}
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="liquid-glass rounded-2xl p-5 md:p-6 hover:bg-white/[0.04] transition group cursor-pointer"
            >
              <div className="relative z-[1] flex items-start gap-4">
                <div className="liquid-glass-strong w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                  <FileAudio className="h-5 w-5 text-white relative z-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-body font-medium text-base truncate">
                      {m.title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-white/60 px-2 py-0.5 rounded-full border border-white/15">
                      {m.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-white/50 font-body flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {new Date(m.created_at).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>{m.action_items?.length ?? 0} tasks extracted</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-white transition shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavBar({
  email,
  onSignOut,
  active,
}: {
  email?: string;
  onSignOut: () => void;
  active: "Dashboard" | "History" | "Settings";
}) {
  const links = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "History", to: "/history" },
    { label: "Settings", to: "/settings" },
  ];
  return (
    <nav className="px-6 lg:px-10 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="liquid-glass-strong h-9 w-9 rounded-full flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white relative z-10" />
        </div>
        <span className="font-heading italic text-2xl text-white">Chronos Agent</span>
      </Link>
      <div className="hidden md:flex liquid-glass rounded-full px-1.5 py-1 items-center gap-0">
        {links.map((l) => (
          <Link
            key={l.label}
            to={l.to}
            className={`px-3 py-2 text-sm font-medium font-body relative z-10 transition rounded-full ${
              active === l.label ? "text-white bg-white/10" : "text-white/70 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex liquid-glass rounded-full px-3 py-1.5 items-center gap-2">
          <UserIcon className="h-3.5 w-3.5 text-white/70 relative z-10" />
          <span className="text-xs text-white/80 font-body relative z-10">{email}</span>
        </div>
        <button
          onClick={onSignOut}
          className="liquid-glass-strong rounded-full px-4 py-2 text-sm text-white inline-flex items-center gap-2"
        >
          <span className="relative z-10 inline-flex items-center gap-2">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </span>
        </button>
      </div>
    </nav>
  );
}

export default HistoryPage;
