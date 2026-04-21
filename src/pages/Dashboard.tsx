import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Sparkles, FileText, ListChecks, Activity, ScrollText,
  Mail, StickyNote, MessageSquare, Download, LogOut,
  User as UserIcon, Loader2, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type TabKey = "transcript" | "tasks" | "scope" | "agent";

const SAMPLE = {
  title: "Q1 Product Roadmap Sync",
  summary:
    "The team aligned on three priority initiatives for Q1: shipping the new onboarding flow, sunsetting the legacy billing UI, and launching the partner integrations beta. Engineering raised concerns about capacity and proposed pulling in two contractors. Marketing committed to a launch campaign for late February.",
  transcript: [
    { timestamp: "00:00", speaker: "Sarah", text: "Thanks everyone for joining. Let's start with the Q1 roadmap." },
    { timestamp: "00:18", speaker: "Marcus", text: "I've put together a draft prioritisation. Onboarding is the clear top." },
    { timestamp: "01:02", speaker: "Elena", text: "Agreed. We're losing too many users at activation." },
    { timestamp: "02:14", speaker: "Sarah", text: "Engineering — can we hit a Feb 28 ship date?" },
    { timestamp: "02:30", speaker: "David", text: "Tight. We'd need two contractors and to descope the analytics rewrite." },
  ],
  decisions: [
    "Ship new onboarding flow by Feb 28",
    "Sunset legacy billing UI in Q2",
    "Hire 2 contractors for engineering capacity",
  ],
  action_items: [
    { title: "Draft contractor JD", owner: "Sarah", due: "Jan 24", status: "confirmed" },
    { title: "Build onboarding wireframes", owner: "Elena", due: "Jan 31", status: "confirmed" },
    { title: "Plan launch campaign", owner: "Marcus", due: "Feb 14", status: "confirmed" },
    { title: "Define billing sunset comms", owner: "Sarah", due: "Feb 21", status: "suggestion" },
  ],
  timeline: [
    { date: "Jan 24", milestone: "Contractor JD live" },
    { date: "Jan 31", milestone: "Onboarding wireframes done" },
    { date: "Feb 14", milestone: "Campaign brief approved" },
    { date: "Feb 28", milestone: "Onboarding ship date" },
  ],
  scope_of_work:
    "Scope: Redesign and ship the user onboarding flow targeting a 25% lift in 7-day activation. Includes new welcome screen, progressive profile build, contextual product tour, and instrumentation. Out of scope: billing changes, mobile parity (tracked separately).",
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("transcript");
  const [hasResult, setHasResult] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const log = (msg: string) => setAgentLog((l) => [...l, msg]);

  const simulate = (file: File) => {
    setHasResult(false);
    setAgentLog([]);
    setUploading(true);
    setProgress(0);
    setTab("agent");
    log(`📤 Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);
    const t = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { window.clearInterval(t); return 100; }
        return Math.min(p + 12, 100);
      });
    }, 200);
    window.setTimeout(() => {
      window.clearInterval(t);
      setProgress(100);
      setUploading(false);
      setProcessing(true);
      log("✅ Upload complete.");
      log("🎙️ Transcribing audio…");
      window.setTimeout(() => {
        log("🧠 Extracting tasks, decisions and scope…");
        window.setTimeout(() => {
          log("✅ Done — artifacts generated.");
          setProcessing(false);
          setHasResult(true);
          setTab("transcript");
          toast.success("Meeting processed successfully");
        }, 1400);
      }, 1400);
    }, 1800);
  };

  const onFile = (f?: File | null) => { if (f) simulate(f); };
  const requireResult = () => {
    if (!hasResult) { toast.error("Process a meeting first"); return false; }
    return true;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{
        background: "radial-gradient(50% 40% at 15% 10%, rgba(99,102,241,0.22), transparent 60%), radial-gradient(45% 35% at 85% 90%, rgba(217,70,239,0.16), transparent 60%), #050507",
      }} />

      <NavBar email={user?.email} onSignOut={handleSignOut} active="Dashboard" />

      <div className="px-6 lg:px-10 pb-32 pt-4 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 max-w-[1500px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass rounded-3xl p-6 md:p-8">
          <h2 className="text-2xl font-heading italic text-white relative z-[1]">Upload your meeting recording</h2>
          <p className="mt-1 text-sm text-white/60 font-body relative z-[1]">Drop an audio or video file. The agent handles the rest.</p>

          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!uploading && !processing) onFile(e.dataTransfer.files?.[0]); }}
            className={`mt-6 relative z-[1] block rounded-2xl border border-dashed cursor-pointer p-10 text-center transition-all ${
              dragOver ? "border-white/60 bg-white/5 scale-[1.01]" : "border-white/15 hover:border-white/30 hover:bg-white/[0.02]"
            } ${uploading || processing ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="mx-auto liquid-glass-strong w-12 h-12 rounded-full flex items-center justify-center">
              <Upload className="h-5 w-5 text-white relative z-10" />
            </div>
            <p className="mt-4 text-sm text-white font-body">Drag & drop or click to upload</p>
            <p className="mt-1 text-xs text-white/50 font-body">MP3, WAV, MP4, M4A — up to 25MB</p>
          </label>

          {uploading && (
            <div className="mt-4 relative z-[1]">
              <div className="flex items-center justify-between text-xs text-white/70 font-body mb-2">
                <span>Uploading…</span><span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 relative z-[1]">
            <button onClick={() => inputRef.current?.click()} disabled={uploading || processing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black py-3 font-medium text-sm disabled:opacity-60">
              {uploading || processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>) : (<><Upload className="h-4 w-4" /> Upload & Process</>)}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 relative z-[1]">
            {[
              { Icon: Mail, label: "Send Email" },
              { Icon: StickyNote, label: "Create Notion" },
              { Icon: MessageSquare, label: "Post to Slack" },
            ].map(({ Icon, label }) => (
              <button key={label} onClick={() => requireResult() && toast.success(`${label} (demo)`)} disabled={!hasResult}
                className="liquid-glass rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-white/[0.04] transition disabled:opacity-40">
                <Icon className="h-4 w-4 text-white/80 relative z-[1]" />
                <span className="text-[10px] text-white/60 font-body relative z-[1]">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="liquid-glass rounded-3xl p-6 md:p-8 min-h-[600px] flex flex-col">
          <div className="flex items-center justify-between mb-5 relative z-[1]">
            <h2 className="text-2xl font-heading italic text-white">{hasResult ? SAMPLE.title : "Your meeting insights"}</h2>
            <button onClick={() => requireResult() && toast.success("PDF downloaded (demo)")} disabled={!hasResult}
              className="liquid-glass rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-xs text-white disabled:opacity-40">
              <span className="relative z-10 inline-flex items-center gap-1.5"><Download className="h-3 w-3" /> PDF</span>
            </button>
          </div>

          <div className="flex gap-1 liquid-glass rounded-full p-1 self-start mb-5 relative z-[1]">
            {([
              { k: "transcript", I: ScrollText, l: "Transcript" },
              { k: "tasks", I: ListChecks, l: "Tasks" },
              { k: "scope", I: FileText, l: "Scope" },
              { k: "agent", I: Activity, l: "Agent" },
            ] as { k: TabKey; I: typeof Activity; l: string }[]).map(({ k, I, l }) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-3 py-1.5 text-xs font-body inline-flex items-center gap-1.5 rounded-full transition ${
                  tab === k ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}>
                <span className="relative z-10 inline-flex items-center gap-1.5"><I className="h-3 w-3" />{l}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 relative z-[1]">
              {tab === "agent" && (
                <div className="space-y-2 font-mono text-xs text-white/80">
                  {agentLog.length === 0 ? (
                    <p className="text-white/40 font-body italic">Logs from the agent will stream here.</p>
                  ) : agentLog.map((l, i) => <div key={i} className="liquid-glass rounded-lg px-3 py-2"><span className="relative z-10">{l}</span></div>)}
                </div>
              )}
              {tab === "transcript" && (
                hasResult ? (
                  <div className="space-y-3">
                    {SAMPLE.transcript.map((l, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-xs text-white/40 font-mono shrink-0 w-12">{l.timestamp}</span>
                        <div>
                          <span className="text-xs text-white/60 font-body">{l.speaker}</span>
                          <p className="text-sm text-white font-body font-light mt-0.5">{l.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <h3 className="text-sm text-white/60 font-body uppercase tracking-wider mb-3">Summary</h3>
                      <p className="text-sm text-white/85 font-body font-light">{SAMPLE.summary}</p>
                    </div>
                  </div>
                ) : <EmptyState />
              )}
              {tab === "tasks" && (
                hasResult ? (
                  <div className="space-y-2">
                    {SAMPLE.action_items.map((a, i) => (
                      <div key={i} className="liquid-glass rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 relative z-[1] ${a.status === "confirmed" ? "text-emerald-400" : "text-white/30"}`} />
                        <div className="flex-1 relative z-[1]">
                          <p className="text-sm text-white font-body">{a.title}</p>
                          <p className="text-xs text-white/50 font-body mt-0.5">{a.owner} · due {a.due}</p>
                        </div>
                      </div>
                    ))}
                    <h3 className="text-sm text-white/60 font-body uppercase tracking-wider mt-6 mb-3">Decisions</h3>
                    {SAMPLE.decisions.map((d, i) => (
                      <div key={i} className="text-sm text-white/85 font-body font-light flex gap-2"><span>•</span>{d}</div>
                    ))}
                  </div>
                ) : <EmptyState />
              )}
              {tab === "scope" && (
                hasResult ? (
                  <div>
                    <p className="text-sm text-white/85 font-body font-light leading-relaxed">{SAMPLE.scope_of_work}</p>
                    <h3 className="text-sm text-white/60 font-body uppercase tracking-wider mt-6 mb-3">Timeline</h3>
                    <div className="space-y-2">
                      {SAMPLE.timeline.map((t, i) => (
                        <div key={i} className="liquid-glass rounded-xl px-4 py-3 flex items-center gap-4">
                          <span className="text-xs font-mono text-white/60 relative z-[1] w-16 shrink-0">{t.date}</span>
                          <span className="text-sm text-white font-body relative z-[1]">{t.milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <EmptyState />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-white/40 font-body">
      <Sparkles className="h-6 w-6 mb-3 text-white/30" />
      <p className="text-sm">Upload a meeting to see results.</p>
    </div>
  );
}

function NavBar({ email, onSignOut, active }: { email?: string; onSignOut: () => void; active: "Dashboard" | "History" | "Settings" }) {
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
          <Link key={l.label} to={l.to}
            className={`px-3 py-2 text-sm font-medium font-body relative z-10 transition rounded-full ${
              active === l.label ? "text-white bg-white/10" : "text-white/70 hover:text-white"
            }`}>{l.label}</Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex liquid-glass rounded-full px-3 py-1.5 items-center gap-2">
          <UserIcon className="h-3.5 w-3.5 text-white/70 relative z-10" />
          <span className="text-xs text-white/80 font-body relative z-10">{email}</span>
        </div>
        <button onClick={onSignOut} className="liquid-glass-strong rounded-full px-4 py-2 text-sm text-white inline-flex items-center gap-2">
          <span className="relative z-10 inline-flex items-center gap-2"><LogOut className="h-3.5 w-3.5" /> Sign out</span>
        </button>
      </div>
    </nav>
  );
}
