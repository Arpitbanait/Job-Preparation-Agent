import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Sparkles,
  FileSearch,
  BrainCircuit,
  Zap,
} from "lucide-react";

export function HeroSection() {
  // ---------- SCROLL HANDLERS ----------
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      aria-labelledby="hero-heading"
    >
      {/* ==== ANIMATED BACKGROUND ==== */}
      <div className="absolute inset-0 gradient-hero-bg" aria-hidden="true" />
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow delay-200"
        aria-hidden="true"
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* ==== MAIN CONTENT ==== */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="accent"
            className="mb-6 animate-fade-in shadow-md shadow-primary/20 px-4 py-1"
          >
            <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
            AI-Powered Job Search Assistant
          </Badge>

          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 animate-fade-in-up delay-75"
          >
            Land Your Dream Job with{" "}
            <span className="gradient-text">AI Intelligence</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up delay-150">
            Optimize your resume, discover perfect job matches, ace interviews,
            and automate applications — all powered by cutting-edge AI.
          </p>

          {/* ==== CTA BUTTONS WITH FUNCTIONALITY ==== */}
          <nav
            aria-label="Hero calls to action"
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up delay-200"
          >
            <Button
              variant="hero"
              size="xl"
              aria-label="Start your job search journey"
              onClick={() => scrollTo("job-search-section")}
            >
              <span className="mr-2">Start Your Journey</span>
              <ArrowRight className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              size="xl"
              onClick={() => scrollTo("how-it-works-section")}
            >
              See How It Works
            </Button>
          </nav>

          {/* ==== Feature Pills ==== */}
          <div
            className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up delay-300"
            aria-hidden="false"
          >
            <FeaturePill icon={FileSearch} label="ATS Resume Scoring" />
            <FeaturePill icon={BrainCircuit} label="Smart Job Matching" />
            <FeaturePill icon={Zap} label="Instant Interview Prep" />
          </div>
        </div>

        {/* ==== FLOATING DASHBOARD PREVIEW ==== */}
        <div className="relative mt-20 max-w-5xl mx-auto animate-fade-in-up delay-400">
          <div className="relative">
            <div className="glass-card rounded-3xl p-[2px] shadow-2xl neon-card">
              <div className="bg-gradient-to-br from-secondary/50 to-background rounded-3xl p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard value="95%" label="ATS Score" color="success" />
                  <StatCard value="42" label="Jobs Matched" color="primary" />
                  <StatCard value="15" label="Interview Qs" color="accent" />
                </div>
              </div>
            </div>

            <div
              className="absolute -top-6 -right-6 w-32 h-32 bg-accent/10 rounded-2xl blur-2xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-2xl blur-2xl"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------- */
/* Feature Pills */
/* ------------------------------------------------------------- */
const FeaturePill = memo(
  ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-sm backdrop-blur-md">
        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  }
);

/* ------------------------------------------------------------- */
/* Stat Card */
/* ------------------------------------------------------------- */
const colorMap = {
  success: "text-emerald-500",
  primary: "text-primary",
  accent: "text-accent",
} as const;

const StatCard = memo(
  ({ value, label, color }: { value: string; label: string; color: keyof typeof colorMap }) => {
    const cls = colorMap[color];
    return (
      <div className="text-center p-4 bg-background/80 rounded-xl border border-border/50 shadow">
        <div className={`text-3xl font-bold ${cls}`}>{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    );
  }
);

export default HeroSection;
