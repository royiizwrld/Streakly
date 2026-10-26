import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  Cloud,
  ListTodo,
  Menu,
  Moon,
  PartyPopper,
  Sparkles,
  Sprout,
  Target,
  Wand2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTACT_EMAIL, TERMS_LAST_UPDATED } from "@/lib/terms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Streakly — Daily Habit & Routine Tracker" },
      {
        name: "description",
        content:
          "Build habits that stick. Track daily check-ins, streaks and routines, get coached by AI, and sync across your devices.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Streakly — Daily Habit & Routine Tracker" },
      {
        property: "og:description",
        content:
          "Build habits that stick. Track daily check-ins, streaks and routines, get coached by AI, and sync across your devices.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const FEATURES = [
  {
    icon: ListTodo,
    title: "Custom habits",
    text: "Icons, colors, categories and flexible frequencies — daily, certain weekdays, or X times per week.",
  },
  {
    icon: CheckCircle2,
    title: "Daily checklist",
    text: "One-tap check-offs with undo, grouped by routine or category, with a daily progress ring.",
  },
  {
    icon: CalendarDays,
    title: "Calendar heatmap",
    text: "A monthly view of your completion history, overall and per habit.",
  },
  {
    icon: Target,
    title: "Streaks & goals",
    text: "Current and longest streaks that respect your schedule, plus targets like 30 days of reading.",
  },
  {
    icon: Sparkles,
    title: "Routines",
    text: "Group habits into Morning, Afternoon and Evening — or any routine you create.",
  },
  {
    icon: Sprout,
    title: "AI habit coach",
    text: "Ask why you keep missing gym days and get small, practical adjustments based on your real history.",
  },
  {
    icon: Wand2,
    title: "Smart bulk add",
    text: "Paste your whole routine in plain words and get structured habits back, ready to edit.",
  },
  {
    icon: PartyPopper,
    title: "Celebrations",
    text: "A confetti moment when you clear everything due today — once a day, never naggy.",
  },
  {
    icon: Moon,
    title: "Light & dark mode",
    text: "Follows your system by default, with fourteen color palettes to make it yours.",
  },
  {
    icon: Cloud,
    title: "Sync across devices",
    text: "Your habits and history live in your account, so every device stays up to date.",
  },
];

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes. You can create an account and use every feature — habits, streaks, stats, the AI coach and sync — for free.",
  },
  {
    q: "What counts toward a streak?",
    a: "Only days a habit is actually due. If your habit runs Monday/Wednesday/Friday, a quiet Tuesday never breaks your streak. For 'X times per week' habits, a streak counts consecutive weeks where you hit your target.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. The app is fully responsive and can be installed on your phone's home screen, where it opens like a native app.",
  },
  {
    q: "Does my data sync between devices?",
    a: "Yes. Your habits, check-ins, notes and goals are stored in your account, so they appear on any device where you sign in.",
  },
  {
    q: "How does the AI coach use my data?",
    a: "When you ask the coach a question, a compact summary of your habits and check-in history is sent to the AI so it can give advice based on your real patterns. It only sees your data, and only when you chat with it.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. Settings includes a 'Delete account and all data' option that permanently removes your profile, habits and history.",
  },
];

/** Static, clearly-labeled sample preview of the checklist + heatmap. */
function SamplePreview() {
  const sampleHabits = [
    { icon: "💧", name: "Drink water", done: true },
    { icon: "📖", name: "Read 10 pages", done: true },
    { icon: "🏃", name: "Morning run", done: false },
  ];
  const weeks = [
    [0.9, 1, 0.6, 1, 0.8, 1, 0.4],
    [1, 0.7, 1, 0.9, 1, 0.5, 1],
    [0.6, 1, 1, 0.8, 1, 1, 0.7],
    [1, 0.9, 0.5, 1, 1, 0.8, 1],
  ];
  return (
    <div className="relative" aria-label="Sample preview of the app, shown with fictional data">
      <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="rounded-2xl bg-hero p-4 text-primary-foreground">
          <p className="text-xs font-medium opacity-85">Today · Sample data</p>
          <p className="mt-1 font-display text-2xl font-extrabold">2 of 3 done</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-foreground/25">
            <div className="h-full w-2/3 rounded-full bg-primary-foreground" />
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {sampleHabits.map((h) => (
            <li
              key={h.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${
                  h.done ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {h.done && <Check className="size-4" />}
              </span>
              <span className="text-base" aria-hidden>
                {h.icon}
              </span>
              <span className={`text-sm font-medium ${h.done ? "line-through opacity-60" : ""}`}>
                {h.name}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-2xl border border-border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">October · Sample data</p>
          <div className="grid grid-cols-7 gap-1.5" aria-hidden>
            {weeks.flat().map((v, i) => (
              <span
                key={i}
                className="aspect-square rounded-[4px] bg-primary"
                style={{ opacity: 0.12 + v * 0.88 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Signed-in users go straight to the app; installed app skips the landing page.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate({ to: "/today", replace: true });
      else if (isStandalone()) navigate({ to: "/login", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="grid size-8 place-items-center rounded-xl bg-hero text-primary-foreground">✓</span>
            Streakly
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Sections">
            {[
              ["#features", "Features"],
              ["#how-it-works", "How it works"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="rounded-full">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="rounded-full">
              <Link to="/signup">Get started</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-border/60 px-4 py-2 md:hidden" aria-label="Sections">
            {[
              ["#features", "Features"],
              ["#how-it-works", "How it works"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-2 md:pt-20">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Build habits that stick, one streak at a time
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              A simple daily checklist, honest streaks and an AI coach that helps you adjust — not
              judge.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild className="rounded-full px-6">
                <Link to="/signup">Get started free</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild className="rounded-full">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
          <SamplePreview />
        </section>

        <section id="features" className="border-t border-border/60 bg-muted/40 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Everything you need to keep showing up
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <f.icon className="size-6 text-primary" aria-hidden />
                  <h3 className="mt-3 font-display text-lg font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-display text-3xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["Create your account", "Sign up with your email in under a minute."],
                ["Add your habits", "Create them one by one, or paste your whole routine and let the AI structure it."],
                ["Check in daily", "Tap to check off, watch your streaks grow, and let the coach help you adjust."],
              ].map(([title, text], i) => (
                <li key={title} className="rounded-2xl border border-border bg-card p-5">
                  <span className="grid size-9 place-items-center rounded-full bg-hero font-display font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/40 py-16" aria-labelledby="privacy-heading">
          <div className="mx-auto max-w-3xl px-4">
            <h2 id="privacy-heading" className="font-display text-3xl font-bold tracking-tight">
              Your data stays yours
            </h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>
                Your habits, check-ins and notes are private to your account. Nobody else can see
                them, and they are never sold or shared with advertisers.
              </p>
              <p>
                The AI coach only reads a summary of your own history when you chat with it, so its
                advice reflects your real patterns.
              </p>
              <p>
                You can delete your account and all of its data at any time from Settings — no
                emails, no waiting.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="mt-6">
              {FAQ.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto max-w-5xl rounded-3xl bg-hero px-6 py-14 text-center text-primary-foreground shadow-card">
            <h2 className="font-display text-3xl font-extrabold">Start your first streak today</h2>
            <p className="mx-auto mt-2 max-w-md opacity-90">
              It takes a minute to set up, and one tap a day to keep going.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild className="rounded-full px-6">
                <Link to="/signup">Get started free</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              >
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {year} Streakly</p>
          <nav className="flex items-center gap-4" aria-label="Legal">
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">
              {CONTACT_EMAIL}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
