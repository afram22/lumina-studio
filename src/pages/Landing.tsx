import { motion } from "framer-motion";
import { ArrowUpRight, Play, Zap, Palette, BarChart3, Shield, LogOut } from "lucide-react";
import { BlurText } from "@/components/BlurText";
import { HlsVideo } from "@/components/HlsVideo";
import { useAuth } from "@/hooks/useAuth";


const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4";
const START_HLS = "https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8";
const STATS_HLS = "https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8";
const CTA_HLS = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";

const FEATURE_GIF_1 = "https://motionsites.ai/assets/hero-finlytic-preview-CV9g0FHP.gif";
const FEATURE_GIF_2 = "https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif";

function Navbar() {
  const links = ["Home", "Services", "Work", "Process", "Pricing"];
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-8 lg:px-16 py-3 flex items-center justify-between">
      <div className="liquid-glass-strong h-12 w-12 rounded-full flex items-center justify-center">
        <span className="font-heading italic text-white text-xl relative z-10">S</span>
      </div>
      <div className="hidden md:flex liquid-glass rounded-full px-1.5 py-1 items-center gap-0">
        {links.map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase()}`}
            className="px-3 py-2 text-sm font-medium text-white/90 font-body relative z-10 hover:text-white transition-colors"
          >
            {l}
          </a>
        ))}
        {user ? (
          <>
            <Link
              to="/dashboard"
              className="ml-1 inline-flex items-center gap-1 bg-white text-black rounded-full px-3.5 py-1.5 text-sm font-medium relative z-10"
            >
              Dashboard <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleSignOut}
              className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white/90 hover:text-white relative z-10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-3 py-2 text-sm font-medium text-white/90 font-body relative z-10 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="ml-1 inline-flex items-center gap-1 bg-white text-black rounded-full px-3.5 py-1.5 text-sm font-medium relative z-10"
            >
              Get Started <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </div>
      {user ? (
        <Link
          to="/dashboard"
          className="md:hidden liquid-glass-strong rounded-full px-4 py-2 text-sm text-white relative"
        >
          <span className="relative z-10 inline-flex items-center gap-1">
            Dashboard <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      ) : (
        <Link
          to="/login"
          className="md:hidden liquid-glass-strong rounded-full px-4 py-2 text-sm text-white relative"
        >
          <span className="relative z-10 inline-flex items-center gap-1">
            Sign in <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-visible" style={{ height: 1000 }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/images/hero_bg.jpeg"
        className="absolute left-0 w-full h-auto object-contain z-0"
        style={{ top: "20%" }}
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/5 z-0" />
      <div
        className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none"
        style={{
          height: 300,
          background: "linear-gradient(to bottom, transparent, black)",
        }}
      />

      <div
        className="relative z-10 h-full flex flex-col items-center px-6"
        style={{ paddingTop: 150 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="liquid-glass rounded-full px-1 py-1 flex items-center gap-2"
        >
          <span className="bg-white text-black rounded-full px-3 py-1 text-xs font-semibold relative z-10">
            New
          </span>
          <span className="text-white text-xs md:text-sm font-body pr-3 relative z-10">
            Introducing AI-powered web design.
          </span>
        </motion.div>

        <h1 className="mt-8 text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.85] max-w-3xl text-center tracking-tight">
          <BlurText text="The Website Your Brand Deserves" delay={100} />
        </h1>

        <motion.p
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-6 max-w-xl text-center text-sm md:text-base text-white font-body font-light leading-snug"
        >
          Stunning design. Blazing performance. Built by AI, refined by experts. This is web design,
          wildly reimagined.
        </motion.p>

        <motion.div
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-8 flex items-center gap-4"
        >
          <a
            href="#start"
            className="liquid-glass-strong rounded-full px-5 py-2.5 inline-flex items-center gap-2 text-white text-sm font-body font-medium"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              Get Started <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
          <button className="text-white text-sm font-body font-medium inline-flex items-center gap-2">
            <Play className="h-4 w-4 fill-white" /> Watch the Film
          </button>
        </motion.div>

        <div className="mt-auto pb-8 pt-16 flex flex-col items-center gap-6">
          <div className="liquid-glass rounded-full px-3.5 py-1">
            <span className="text-xs text-white/80 font-body relative z-10">
              Trusted by the teams behind
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-12 md:gap-16">
            {["Stripe", "Vercel", "Linear", "Notion", "Figma"].map((n) => (
              <span key={n} className="text-2xl md:text-3xl font-heading italic text-white">
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoBgSection({
  src,
  children,
  desaturate = false,
  minHeight = 500,
}: {
  src: string;
  children: React.ReactNode;
  desaturate?: boolean;
  minHeight?: number;
}) {
  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight }}>
      <HlsVideo
        src={src}
        className="absolute inset-0 w-full h-full object-cover"
        style={desaturate ? { filter: "saturate(0)" } : undefined}
      />
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-[1]"
        style={{ height: 200, background: "linear-gradient(to bottom, black, transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-[1]"
        style={{ height: 200, background: "linear-gradient(to top, black, transparent)" }}
      />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function StartSection() {
  return (
    <VideoBgSection src={START_HLS} minHeight={600}>
      <div
        id="start"
        className="flex flex-col items-center text-center px-6 py-32 max-w-3xl mx-auto"
      >
        <div className="liquid-glass rounded-full px-3.5 py-1 mb-6">
          <span className="text-xs font-medium text-white font-body relative z-10">
            How It Works
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
          You dream it. We ship it.
        </h2>
        <p className="mt-6 text-white/60 font-body font-light text-sm md:text-base max-w-xl">
          Share your vision. Our AI handles the rest—wireframes, design, code, launch. All in days,
          not quarters.
        </p>
        <a
          href="#cta"
          className="mt-8 liquid-glass-strong rounded-full px-6 py-3 inline-flex items-center gap-2 text-white text-sm font-body font-medium"
        >
          <span className="relative z-10 inline-flex items-center gap-2">
            Get Started <ArrowUpRight className="h-4 w-4" />
          </span>
        </a>
      </div>
    </VideoBgSection>
  );
}

function FeaturesChess() {
  const rows = [
    {
      reverse: false,
      title: "Designed to convert. Built to perform.",
      body: "Every pixel is intentional. Our AI studies what works across thousands of top sites—then builds yours to outperform them all.",
      cta: "Learn more",
      gif: FEATURE_GIF_1,
    },
    {
      reverse: true,
      title: "It gets smarter. Automatically.",
      body: "Your site evolves on its own. AI monitors every click, scroll, and conversion—then optimizes in real time. No manual updates. Ever.",
      cta: "See how it works",
      gif: FEATURE_GIF_2,
    },
  ];

  return (
    <section id="services" className="px-6 lg:px-16 py-24 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="liquid-glass rounded-full px-3.5 py-1 mb-5">
          <span className="text-xs font-medium text-white font-body relative z-10">
            Capabilities
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
          Pro features. Zero complexity.
        </h2>
      </div>

      <div className="space-y-20">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex flex-col ${r.reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-10 md:gap-16 items-center`}
          >
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading italic text-white leading-[0.95] tracking-tight">
                {r.title}
              </h3>
              <p className="mt-5 text-white/60 font-body font-light text-sm md:text-base max-w-md">
                {r.body}
              </p>
              <a
                href="#start"
                className="mt-6 liquid-glass-strong rounded-full px-5 py-2.5 inline-flex items-center gap-2 text-white text-sm font-body font-medium"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  {r.cta} <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            </div>
            <div className="flex-1 w-full">
              <div className="liquid-glass rounded-2xl overflow-hidden aspect-[4/3]">
                <img
                  src={r.gif}
                  alt={r.title}
                  className="w-full h-full object-cover relative z-[1]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const items = [
    {
      Icon: Zap,
      title: "Days, Not Months",
      body: "Concept to launch at a pace that redefines fast. Because waiting isn't a strategy.",
    },
    {
      Icon: Palette,
      title: "Obsessively Crafted",
      body: "Every detail considered. Every element refined. Design so precise, it feels inevitable.",
    },
    {
      Icon: BarChart3,
      title: "Built to Convert",
      body: "Layouts informed by data. Decisions backed by performance. Results you can measure.",
    },
    {
      Icon: Shield,
      title: "Secure by Default",
      body: "Enterprise-grade protection comes standard. SSL, DDoS mitigation, compliance. All included.",
    },
  ];

  return (
    <section id="process" className="px-6 lg:px-16 py-24 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center mb-14">
        <div className="liquid-glass rounded-full px-3.5 py-1 mb-5">
          <span className="text-xs font-medium text-white font-body relative z-10">Why Us</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
          The difference is everything.
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(({ Icon, title, body }) => (
          <div key={title} className="liquid-glass rounded-2xl p-6">
            <div className="liquid-glass-strong rounded-full w-10 h-10 flex items-center justify-center mb-5">
              <Icon className="h-5 w-5 text-white relative z-10" />
            </div>
            <h3 className="text-xl font-heading italic text-white relative z-[1]">{title}</h3>
            <p className="mt-2 text-white/60 font-body font-light text-sm relative z-[1]">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { v: "200+", l: "Sites launched" },
    { v: "98%", l: "Client satisfaction" },
    { v: "3.2x", l: "More conversions" },
    { v: "5 days", l: "Average delivery" },
  ];
  return (
    <VideoBgSection src={STATS_HLS} desaturate minHeight={600}>
      <div className="px-6 lg:px-16 py-32 max-w-6xl mx-auto">
        <div className="liquid-glass rounded-3xl p-12 md:p-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 relative z-[1]">
            {stats.map((s) => (
              <div key={s.l} className="text-center md:text-left">
                <div className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white leading-none">
                  {s.v}
                </div>
                <div className="mt-3 text-white/60 font-body font-light text-sm">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VideoBgSection>
  );
}

function Testimonials() {
  const items = [
    {
      q: "A complete rebuild in five days. The result outperformed everything we'd spent months building before.",
      n: "Sarah Chen",
      r: "CEO, Luminary",
    },
    {
      q: "Conversions up 4x. That's not a typo. The design just works differently when it's built on real data.",
      n: "Marcus Webb",
      r: "Head of Growth, Arcline",
    },
    {
      q: "They didn't just design our site. They defined our brand. World-class doesn't begin to cover it.",
      n: "Elena Voss",
      r: "Brand Director, Helix",
    },
  ];
  return (
    <section id="work" className="px-6 lg:px-16 py-24 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center mb-14">
        <div className="liquid-glass rounded-full px-3.5 py-1 mb-5">
          <span className="text-xs font-medium text-white font-body relative z-10">
            What They Say
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
          Don't take our word for it.
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((t) => (
          <div key={t.n} className="liquid-glass rounded-2xl p-8">
            <p className="text-white/80 font-body font-light text-sm italic relative z-[1]">
              "{t.q}"
            </p>
            <div className="mt-6 relative z-[1]">
              <div className="text-white font-body font-medium text-sm">{t.n}</div>
              <div className="text-white/50 font-body font-light text-xs">{t.r}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTAFooter() {
  return (
    <VideoBgSection src={CTA_HLS} minHeight={700}>
      <div id="cta" className="px-6 lg:px-16 pt-32 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading italic text-white leading-[0.85] tracking-tight max-w-3xl">
            Your next website starts here.
          </h2>
          <p className="mt-6 text-white/70 font-body font-light text-sm md:text-base max-w-xl">
            Book a free strategy call. See what AI-powered design can do. No commitment, no
            pressure. Just possibilities.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#"
              className="liquid-glass-strong rounded-full px-6 py-3 inline-flex items-center gap-2 text-white text-sm font-body font-medium"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Book a Call <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <a
              href="#"
              className="bg-white text-black rounded-full px-6 py-3 inline-flex items-center gap-2 text-sm font-body font-medium"
            >
              View Pricing <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <footer className="mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 pb-8">
          <span className="text-white/40 text-xs font-body">
            © 2026 Studio. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="text-white/40 hover:text-white/70 text-xs font-body">
                {l}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </VideoBgSection>
  );
}

function LandingPage() {
  return (
    <main className="bg-background min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <StartSection />
      <FeaturesChess />
      <FeaturesGrid />
      <StatsSection />
      <Testimonials />
      <CTAFooter />
    </main>
  );
}
