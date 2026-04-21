import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Sparkles, FileText, ListChecks, Activity, ScrollText,
  Mail, Presentation, MessageSquare, Download, LogOut,
  User as UserIcon, Loader2, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Meeting } from "@/types/meeting";
import { downloadPpt, downloadText, emailMailto, postToSlack } from "@/lib/exports";

type TabKey = "transcript" | "tasks" | "scope" | "agent";

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("transcript");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  // Realtime subscription on the active meeting
  useEffect(() => {
    if (!meeting?.id) return;
    const channel = supabase
      .channel(`meeting-${meeting.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "meetings",
        filter: `id=eq.${meeting.id}`,
      }, (payload) => {
        setMeeting((prev) => prev ? { ...prev, ...(payload.new as Meeting) } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [meeting?.id]);

  const processing = meeting?.status === "transcribing" || meeting?.status === "extracting";
  const hasResult = meeting?.status === "done";

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const onFile = async (file?: File | null) => {
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be 20MB or smaller");
      return;
    }
    setUploading(true);
    setProgress(0);
    setTab("agent");

    try {
      // 1. Create meeting row
      const { data: created, error: cErr } = await supabase
        .from("meetings")
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^.]+$/, ""),
          status: "uploading",
          agent_log: [`${new Date().toISOString().slice(11,19)}  📤 Uploading ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)…`],
        })
        .select()
        .single();
      if (cErr || !created) throw new Error(cErr?.message ?? "Failed to create meeting");
      setMeeting(created as unknown as Meeting);

      // 2. Upload to storage with simulated progress
      const path = `${user.id}/${created.id}/${file.name}`;
      const interval = window.setInterval(() => {
        setProgress((p) => Math.min(p + 8, 92));
      }, 200);
      const { error: upErr } = await supabase.storage
        .from("meeting-uploads").upload(path, file, { upsert: true });
      window.clearInterval(interval);
      setProgress(100);
      if (upErr) throw new Error(upErr.message);

      await supabase.from("meetings").update({
        file_path: path,
        agent_log: [
          ...(created.agent_log as string[] ?? []),
          `${new Date().toISOString().slice(11,19)}  ✅ Upload complete.`,
        ],
      }).eq("id", created.id);

      // 3. Trigger processing
      const { error: fnErr } = await supabase.functions.invoke("process-meeting", {
        body: { meetingId: created.id },
      });
      if (fnErr) throw new Error(fnErr.message);

      toast.success("Processing started — watch the Agent tab.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // Switch to transcript tab automatically when result lands
  useEffect(() => {
    if (hasResult && tab === "agent") setTab("transcript");
  }, [hasResult]); // eslint-disable-line

  const requireResult = () => {
    if (!hasResult) { toast.error("Process a meeting first"); return false; }
    return true;
  };

  const handleDownload = () => { if (requireResult() && meeting) downloadText(meeting); };
  const handlePpt = async () => {
    if (!requireResult() || !meeting) return;
    try { await downloadPpt(meeting); toast.success("PPT generated"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to generate PPT"); }
  };
  const handleEmail = () => {
    if (!requireResult() || !meeting) return;
    const to = localStorage.getItem("chronos.integration.emailTo") ?? "";
    if (!to) { toast.error("Set a default email recipient in Settings"); return; }
    window.location.href = emailMailto(meeting, to);
  };
  const handleSlack = async () => {
    if (!requireResult() || !meeting) return;
    const url = localStorage.getItem("chronos.integration.slackWebhook") ?? "";
    if (!url) { toast.error("Add your Slack webhook URL in Settings"); return; }
    try { await postToSlack(meeting, url); toast.success("Posted to Slack"); }
    catch { toast.error("Could not post to Slack"); }
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

          <div className="mt-8 grid grid-cols-4 gap-2 relative z-[1]">
            {[
              { Icon: Mail, label: "Email", onClick: handleEmail },
              { Icon: Presentation, label: "PPT", onClick: handlePpt },
              { Icon: MessageSquare, label: "Slack", onClick: handleSlack },
              { Icon: Download, label: "Download", onClick: handleDownload },
            ].map(({ Icon, label, onClick }) => (
              <button key={label} onClick={onClick} disabled={!hasResult}
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
            <h2 className="text-2xl font-heading italic text-white">{hasResult && meeting ? meeting.title : "Your meeting insights"}</h2>
            <button onClick={handleDownload} disabled={!hasResult}
              className="liquid-glass rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-xs text-white disabled:opacity-40">
              <span className="relative z-10 inline-flex items-center gap-1.5"><Download className="h-3 w-3" /> Download</span>
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
                  {!meeting?.agent_log || meeting.agent_log.length === 0 ? (
                    <p className="text-white/40 font-body italic">Logs from the agent will stream here.</p>
                  ) : meeting.agent_log.map((l, i) => <div key={i} className="liquid-glass rounded-lg px-3 py-2"><span className="relative z-10">{l}</span></div>)}
                </div>
              )}
              {tab === "transcript" && (
                hasResult && meeting ? (
                  <div className="space-y-3">
                    {(meeting.transcript ?? []).map((l, i) => (
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
                      <p className="text-sm text-white/85 font-body font-light">{meeting.summary}</p>
                    </div>
                  </div>
                ) : <EmptyState />
              )}
              {tab === "tasks" && (
                hasResult && meeting ? (
                  <div className="space-y-2">
                    {(meeting.action_items ?? []).map((a, i) => (
                      <div key={i} className="liquid-glass rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 relative z-[1] ${a.status === "confirmed" ? "text-emerald-400" : "text-white/30"}`} />
                        <div className="flex-1 relative z-[1]">
                          <p className="text-sm text-white font-body">{a.title}</p>
                          <p className="text-xs text-white/50 font-body mt-0.5">{a.owner} · due {a.due}</p>
                        </div>
                      </div>
                    ))}
                    <h3 className="text-sm text-white/60 font-body uppercase tracking-wider mt-6 mb-3">Decisions</h3>
                    {(meeting.decisions ?? []).map((d, i) => (
                      <div key={i} className="text-sm text-white/85 font-body font-light flex gap-2"><span>•</span>{d}</div>
                    ))}
                  </div>
                ) : <EmptyState />
              )}
              {tab === "scope" && (
                hasResult && meeting ? (
                  <div>
                    <p className="text-sm text-white/85 font-body font-light leading-relaxed">{meeting.scope_of_work}</p>
                    <h3 className="text-sm text-white/60 font-body uppercase tracking-wider mt-6 mb-3">Timeline</h3>
                    <div className="space-y-2">
                      {(meeting.timeline ?? []).map((t, i) => (
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
