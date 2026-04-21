import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  Bell,
  Mail,
  MessageSquare,
  Shield,
  Palette,
  Check,
  Key,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";


const LS_EMAIL = "chronos.integration.emailTo";
const LS_SLACK = "chronos.integration.slackWebhook";

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [emailNotif, setEmailNotif] = useState(true);
  const [autoExec, setAutoExec] = useState(false);
  const [theme, setTheme] = useState<"dark" | "system">("dark");
  const [saved, setSaved] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [testingSlack, setTestingSlack] = useState(false);

  useEffect(() => {
    setEmailTo(localStorage.getItem(LS_EMAIL) ?? "");
    setSlackWebhook(localStorage.getItem(LS_SLACK) ?? "");
  }, []);

  const copy = (val: string) => { navigator.clipboard.writeText(val); };

  const testSlack = async () => {
    if (!slackWebhook) { toast.error("Add a Slack webhook URL first"); return; }
    setTestingSlack(true);
    try {
      await fetch(slackWebhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "✅ Chronos Agent test message — your webhook works!" }),
      });
      toast.success("Test sent to Slack");
    } catch {
      toast.error("Could not send to Slack");
    } finally {
      setTestingSlack(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSave = () => {
    localStorage.setItem(LS_EMAIL, emailTo);
    localStorage.setItem(LS_SLACK, slackWebhook);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 40% at 15% 10%, rgba(99,102,241,0.22), transparent 60%), radial-gradient(45% 35% at 85% 90%, rgba(217,70,239,0.16), transparent 60%), #050507",
        }}
      />

      <NavBar email={user?.email} onSignOut={handleSignOut} active="Settings" />

      <div className="px-6 lg:px-10 pb-32 pt-4 max-w-[900px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
            Settings
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/60 font-body font-light">
            Tune Chronos to match how you and your team work.
          </p>
        </motion.div>

        {/* Account */}
        <Section icon={UserIcon} title="Account">
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Plan" value="Free preview" />
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <ToggleRow
            label="Email summaries"
            description="Receive meeting summaries via email when processing completes."
            value={emailNotif}
            onChange={setEmailNotif}
          />
          <ToggleRow
            label="Auto-execute agent actions"
            description="Let Chronos send emails and create docs without confirmation."
            value={autoExec}
            onChange={setAutoExec}
          />
        </Section>

        {/* Integrations — Email & Slack */}
        <Section icon={Shield} title="Integrations">
          <div className="relative z-[1] space-y-5">
            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60 mb-2 font-body">
                <Mail className="h-3.5 w-3.5" /> Default email recipient
              </label>
              <div className="liquid-glass rounded-xl flex items-center gap-2 px-3 py-2">
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="team@company.com"
                  className="flex-1 bg-transparent text-sm text-white font-body outline-none relative z-[1]"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-white/40 font-body">
                Used by the “Send Email” action on the Dashboard. Opens your mail client with the report pre-filled.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60 mb-2 font-body">
                <MessageSquare className="h-3.5 w-3.5" /> Slack incoming webhook URL
              </label>
              <div className="liquid-glass rounded-xl flex items-center gap-2 px-3 py-2">
                <input
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/…"
                  className="flex-1 bg-transparent text-sm text-white font-mono outline-none relative z-[1]"
                />
                <button onClick={() => { copy(slackWebhook); toast.success("URL copied"); }} className="p-1.5 text-white/60 hover:text-white relative z-[1]" title="Copy">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={testSlack} disabled={testingSlack} className="p-1.5 text-white/60 hover:text-white relative z-[1] disabled:opacity-40" title="Send test">
                  <RefreshCw className={`h-3.5 w-3.5 ${testingSlack ? "animate-spin" : ""}`} />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-white/40 font-body">
                Create one at <span className="text-white/70">api.slack.com/messaging/webhooks</span>, then paste the URL here.
              </p>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section icon={Palette} title="Appearance">
          <div className="flex gap-2 relative z-[1]">
            {(["dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-full text-xs font-body capitalize transition ${
                  theme === t
                    ? "bg-white text-black"
                    : "liquid-glass text-white/80 hover:text-white"
                }`}
              >
                <span className="relative z-10">{t}</span>
              </button>
            ))}
          </div>
        </Section>

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="rounded-full bg-white text-black px-6 py-3 text-sm font-medium inline-flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Bell;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass rounded-3xl p-6 md:p-8 mb-5"
    >
      <div className="flex items-center gap-2 mb-5 relative z-[1]">
        <Icon className="h-4 w-4 text-white/70" />
        <h2 className="text-xl font-heading italic text-white">{title}</h2>
      </div>
      <div className="space-y-3 relative z-[1]">{children}</div>
    </motion.section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60 font-body">{label}</span>
      <span className="text-sm text-white font-body">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between py-2 gap-4">
      <div>
        <p className="text-sm text-white font-body">{label}</p>
        <p className="text-xs text-white/50 font-body mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition shrink-0 ${
          value ? "bg-white" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
            value ? "translate-x-5 bg-black" : "bg-white"
          }`}
        />
      </button>
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

export default SettingsPage;
