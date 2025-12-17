import { useState, useEffect } from "react";
import { searchJobs } from "@/api/jobs";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import {
  Search,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Heart,
  Stars,
  ExternalLink,
} from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

const perPage = 6;

/* =============================== ANALYTICS =============================== */

function buildAnalytics(jobs: any[]) {
  const clean = (t: string) =>
    t
      .toLowerCase()
      .replace(/engineer|developer|specialist|associate|lead|jr|sr/gi, "")
      .replace(/ai|ml|machine learning|data science|analytics?/gi, "")
      .replace(/[^\w ]/g, "")
      .trim() || "Unknown";

  const count = (field: string, fn?: (v: string) => string) =>
    Object.entries(
      jobs.reduce((acc: any, j: any) => {
        const key = fn ? fn(j[field]) : j[field] || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([label, value]) => ({ label, value: Number(value) }))
      .sort((a, b) => b.value - a.value);

  return {
    roles: count("title", clean).slice(0, 7),
    locations: count("location").slice(0, 7),
    companies: count("company").slice(0, 7),
  };
}

/* ---------------------- Small UI helpers ---------------------- */

function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="animate-pulse inline-block w-1.5 h-1.5 rounded-full bg-white/90" />
      <span className="animate-pulse animation-delay-200 inline-block w-1.5 h-1.5 rounded-full bg-white/70" />
      <span className="animate-pulse animation-delay-400 inline-block w-1.5 h-1.5 rounded-full bg-white/50" />
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse p-6 rounded-2xl bg-white/10 border border-white/6">
      <div className="h-5 w-3/4 bg-white/8 rounded mb-3" />
      <div className="h-3 w-1/2 bg-white/6 rounded mb-4" />
      <div className="h-3 w-full bg-white/6 rounded mb-2" />
      <div className="h-3 w-5/6 bg-white/6 rounded mb-2" />
      <div className="mt-4 h-9 w-32 bg-white/8 rounded" />
    </div>
  );
}

/* ======================================================================== */
/*                    UPGRADED JOB SEARCH SECTION COMPONENT                 */
/* ======================================================================== */

export default function JobSearchSection() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const [jobs, setJobs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);

  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    const s = localStorage.getItem("savedJobs");
    if (s) setSaved(JSON.parse(s));
  }, []);

  // small simulated progress for nicer UX while awaiting backend
  useEffect(() => {
    let t: any;
    if (loading) {
      setFetchProgress(6);
      t = setInterval(() => {
        setFetchProgress((p) => Math.min(95, p + Math.random() * 12));
      }, 450);
    } else {
      setFetchProgress(0);
    }
    return () => clearInterval(t);
  }, [loading]);

  const saveJob = (job: any) => {
    if (saved.some((s) => s.url === job.url)) return toast.warning("Already saved");
    const u = [...saved, job];
    setSaved(u);
    localStorage.setItem("savedJobs", JSON.stringify(u));
    toast.success("Job saved ❤️");
  };

  async function fetchJobs() {
    if (!query) return toast.error("Enter Job Role 🚀");
    setLoading(true);
    try {
      const res = await searchJobs(query, location);
      setJobs(res.jobs || []);
      setAnalytics(buildAnalytics(res.jobs || []));
      setPage(1);
      // finish progress
      setFetchProgress(100);
      setTimeout(() => setFetchProgress(0), 350);
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }

  const list = jobs.slice((page - 1) * perPage, page * perPage);
  const pieColors = ["#7C3AED", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

  return (
    <section id="job-search-section" className="relative min-h-screen py-28">
      {/* BACKGROUND (match hero) */}
      <div className="absolute inset-0 gradient-hero-bg opacity-[0.96]" />
      <div className="absolute top-40 -left-32 w-[420px] h-[420px] bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
      <div className="absolute bottom-40 -right-32 w-[420px] h-[420px] bg-accent/20 blur-3xl rounded-full animate-pulse-slow" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
        }}
      />

      <div className="relative container max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="px-4 py-[3px] shadow-lg">
            <Stars size={14} /> AI Job Finder
          </Badge>

          <h1 className="text-5xl md:text-6xl font-extrabold gradient-text mt-4">Smart Job Search</h1>
          <p className="text-gray-200 text-lg mt-2 opacity-90">
            Real-Time Jobs • Market Insights • Apply Instantly
          </p>
        </div>

        {/* Search card */}
        <Card className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <Input
              placeholder="Role — e.g. AI Engineer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-xl flex-1"
            />

            <Input
              placeholder="Location / Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-xl w-full md:w-72"
            />

            <div className="flex gap-3 items-center">
              <Button
                onClick={fetchJobs}
                className="rounded-xl text-[16px] font-semibold bg-gradient-to-r from-purple-500 to-blue-600"
                aria-label="Search jobs"
              >
                <Search size={18} /> Search
              </Button>

              {/* quick sample role chips */}
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => {
                    setQuery("Data Analyst");
                    setLocation("Remote");
                  }}
                  className="px-3 py-2 rounded-full text-sm bg-white/80 hover:scale-[1.02] transition shadow"
                >
                  Data Analyst
                </button>
                <button
                  onClick={() => {
                    setQuery("ML Engineer");
                    setLocation("Bengaluru");
                  }}
                  className="px-3 py-2 rounded-full text-sm bg-white/80 hover:scale-[1.02] transition shadow"
                >
                  ML Engineer
                </button>
              </div>
            </div>
          </div>

          {/* small helper row */}
          <div className="mt-4 flex items-center justify-between text-sm text-white/80">
            <div className="flex items-center gap-3">
              <div className="bg-white/8 rounded-full px-3 py-1">Live sources: Indeed, Naukri</div>
              <div className="text-xs opacity-80">Tip: try "Data Analyst Remote"</div>
            </div>

            {/* progress indicator when loading */}
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500"
                      style={{ width: `${fetchProgress}%`, transition: "width 300ms linear" }}
                    />
                  </div>
                  <span className="text-xs">Fetching jobs</span>
                  <LoadingDots />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-xs opacity-80">Results: {jobs.length}</div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Empty / feature + filler content when no results */}
        {!loading && jobs.length === 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Feature cards */}
            <Card className="p-6 rounded-2xl shadow-lg bg-white/10 border border-white/6 hover:shadow-2xl transition transform hover:-translate-y-1">
              <h3 className="text-lg font-semibold mb-2">Resume Analyzer</h3>
              <p className="text-sm opacity-80 mb-3">
                Upload your resume to get an ATS-friendly score and actionable improvements.
              </p>
              <div className="flex gap-2">
                <a href="#resume" className="text-sm underline">Try Analyzer</a>
                <span className="text-xs text-muted-foreground">•</span>
                <a href="#workflow" className="text-sm underline">Auto Apply</a>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl shadow-lg bg-white/10 border border-white/6 hover:shadow-2xl transition transform hover:-translate-y-1">
              <h3 className="text-lg font-semibold mb-2">Mock Interview Chat</h3>
              <p className="text-sm opacity-80 mb-3">
                Practice with the AI recruiter — voice + scoring included.
              </p>
              <div className="flex gap-2">
                <a href="#recruiter-chat" className="text-sm underline">Start Chat</a>
                <span className="text-xs text-muted-foreground">•</span>
                <a href="#interview" className="text-sm underline">Interview Lab</a>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl shadow-lg bg-white/10 border border-white/6 hover:shadow-2xl transition transform hover:-translate-y-1">
              <h3 className="text-lg font-semibold mb-2">Market Insights</h3>
              <p className="text-sm opacity-80 mb-3">See hiring demand for roles, cities and companies when you search.</p>
              <div className="flex gap-2">
                <button onClick={() => { setQuery("Data Analyst"); fetchJobs(); }} className="text-sm underline">Try sample</button>
                <span className="text-xs text-muted-foreground">•</span>
                <button onClick={() => { setQuery("AI Engineer"); fetchJobs(); }} className="text-sm underline">AI Engineer</button>
              </div>
            </Card>
          </div>
        )}

        {/* Loading skeletons while fetching */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Results */}
        {!loading && list.length > 0 && (
          <>
            <div className="grid gap-6">
              {list.map((j, i) => (
                <Card key={i} className="p-6 mb-6 rounded-2xl bg-white/95 shadow-lg hover:-translate-y-[3px] transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{j.title}</h3>
                      <p className="flex items-center text-gray-600 text-sm gap-2">
                        <Building2 size={14} /> {j.company}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-[12px]">{j.location || "Remote"}</Badge>
                        <Badge variant="outline" className="text-[12px]">{j.source || "source"}</Badge>
                        {j.experience && <Badge className="bg-blue-100 text-blue-700 text-[11px] px-2">Exp {j.experience}+ yrs</Badge>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <button onClick={() => saveJob(j)} aria-label="Save job">
                        <Heart className={saved.some(s => s.url === j.url) ? "text-red-500" : "text-gray-400"} fill={saved.some(s => s.url === j.url) ? "red" : "none"} />
                      </button>
                      {j.match_score && (
                        <div className={`text-sm px-2 py-1 rounded-md ${j.match_score >= 85 ? "bg-green-100 text-green-700" : j.match_score >= 70 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                          ⭐ {j.match_score}%
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-700 line-clamp-2">{j.description}</p>

                  <div className="flex gap-3 mt-4">
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === i ? null : i)}>
                      {expanded === i ? <ChevronUp /> : <ChevronDown />} {expanded === i ? "Hide Details" : "More Details"}
                    </Button>

                    <Button className="ml-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-md" onClick={() => window.open(j.url, "_blank")}>
                      Apply Now <ExternalLink size={16} />
                    </Button>
                  </div>

                  {expanded === i && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm">
                      {j.description}
                      {j.responsibilities && <div className="mt-3"><strong>Responsibilities:</strong> {j.responsibilities}</div>}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-4 my-10">
              <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span className="px-4 py-2 bg-white/60 rounded-xl shadow-lg">Page {page}</span>
              <Button disabled={page >= Math.ceil(jobs.length / perPage)} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </>
        )}

        {/* Insights */}
        {analytics && (
          <div className="bg-white/95 p-8 rounded-3xl shadow-[0_10px_30px_rgba(2,6,23,0.08)] mt-12">
            <h2 className="text-center text-3xl md:text-4xl font-extrabold gradient-text mb-3">📊 Job Market Insights</h2>
            <p className="text-center text-gray-600 mb-8">Demand by role, hiring cities and companies (based on current search)</p>

            <div className="grid md:grid-cols-3 gap-6">
              <ChartCard title="🔥 Most Demanded Job Roles">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analytics.roles}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="url(#gradA)" />
                    <defs>
                      <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="🌍 Hiring Hotspots">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={analytics.locations} dataKey="value" nameKey="label" label>
                      {analytics.locations.map((_: any, i: number) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="🏢 Companies Hiring Most">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={analytics.companies}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis dataKey="label" fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} dot />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ChartCard wrapper */
function ChartCard({ title, children }: any) {
  return (
    <Card className="rounded-2xl p-4 shadow-xl bg-white">
      <h3 className="font-bold text-[15px] mb-3">{title}</h3>
      <div style={{ minHeight: 200 }}>{children}</div>
    </Card>
  );
}
