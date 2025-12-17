import { useState } from "react";
import { analyzeProResume } from "@/api/resume";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function ResumePro() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", pdf!);
    fd.append("job_description", jd);

    const r = await analyzeProResume(fd);
    setRes(r);
    setLoading(false);
  };

  return (
    <section
      id="resume"
      className="relative min-h-screen py-24 px-6 overflow-hidden"
    >
      {/* ---------------- HERO BACKGROUND (Same as HeroSection) ---------------- */}
      <div className="absolute inset-0 gradient-hero-bg opacity-[0.92]" />
      <div className="absolute top-20 -left-32 w-[450px] h-[450px] bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
      <div className="absolute bottom-20 -right-32 w-[450px] h-[450px] bg-accent/20 blur-3xl rounded-full animate-pulse-slow" />

      {/* Grid Lines Overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
        }}
      />

      <div className="relative max-w-6xl mx-auto space-y-16 z-[5]">
        {/* ========================== INPUT PANEL ========================== */}
        <Card className="p-8 rounded-3xl shadow-2xl bg-white/70 backdrop-blur-xl border border-white/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all">
          <h1 className="text-5xl font-extrabold tracking-tight gradient-text">
            AI Resume ATS Intelligence ⚡
          </h1>
          <p className="text-gray-700 text-[15px] mt-2">
            Upload your resume + paste job description → Generate a full professional ATS breakdown.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Input
              type="file"
              accept="application/pdf"
              className="bg-white/80 border-purple-300 rounded-xl shadow"
              onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
            />

            <Textarea
              placeholder="Paste the full job description here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="min-h-[160px] bg-white/80 border-purple-300 rounded-xl shadow"
            />
          </div>

          <Button
            onClick={run}
            disabled={!pdf || !jd || loading}
            className="mt-6 w-full py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl 
                       hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze Resume 🚀"}
          </Button>
        </Card>

        {/* ========================== LOADING ANIMATION ========================== */}
        {loading && (
          <div className="text-center text-white/90 text-xl mt-10 animate-pulse">
            Analyzing your resume with AI… Please wait ⚡
          </div>
        )}

        {/* ========================== RESULTS PANEL ========================== */}
        {res && !loading && (
          <div className="space-y-16 animate-fade-in-up">
            {/* SUMMARY CARDS */}
            <div className="grid md:grid-cols-3 gap-8">
              <GlassCard>
                <h2 className="text-4xl font-bold text-purple-700">
                  {res.overall_score}%
                </h2>
                <p className="text-gray-700 text-sm">Final ATS Score</p>
              </GlassCard>

              <GlassCard>
                <h2 className="text-4xl font-bold text-blue-600">
                  {res.skills_match?.percentage ?? 0}%
                </h2>
                <p className="text-gray-700 text-sm">Skills Match Rating</p>
              </GlassCard>

              <GlassCard>
                <h2 className="text-4xl font-bold text-green-600">
                  {res.ats_formatting_score}/100
                </h2>
                <p className="text-gray-700 text-sm">Formatting Score</p>
              </GlassCard>
            </div>

            {/* DETAILED SUBSCORES */}
            <GlassCard className="p-8">
              <h3 className="font-semibold mb-4 text-xl">Detailed ATS Subscores</h3>
              <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-800">
                {[
                  { label: "Skill Match", key: "skill_match" },
                  { label: "Experience", key: "experience_score" },
                  { label: "Education", key: "education_score" },
                  { label: "Certifications", key: "certification_score" },
                  { label: "Projects", key: "projects_score" },
                  { label: "Impact", key: "impact_score" },
                  { label: "Formatting", key: "formatting_score" },
                  { label: "Keyword Coverage", key: "keyword_coverage" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-3 border border-gray-100 shadow-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-indigo-600 font-semibold">
                      {(res.subscores?.[item.key] ?? 0).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* ========================== CHARTS ========================== */}
            <div className="grid md:grid-cols-2 gap-12">
              {/* Radar */}
              <GlassCard className="p-8">
                <h3 className="font-semibold mb-3 text-xl">📊 Resume Heatmap</h3>

                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart
                    data={[
                      { item: "Skills", score: res.heatmap?.skills ?? 0 },
                      { item: "Experience", score: res.heatmap?.experience ?? 0 },
                      { item: "Format", score: res.heatmap?.format ?? 0 },
                      { item: "Keywords", score: res.heatmap?.keywords ?? 0 },
                      { item: "Achievements", score: res.heatmap?.achievements ?? 0 },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="item" />
                    <PolarRadiusAxis angle={30} />
                    <Radar
                      dataKey="score"
                      stroke="#6D28D9"
                      fill="#8B5CF6"
                      fillOpacity={0.45}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>

              {/* Bar Chart */}
              <GlassCard className="p-8">
                <h3 className="font-semibold mb-3 text-xl">📈 Score Distribution</h3>

                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={[
                      { name: "Skill Match", score: res.skills_match?.percentage ?? 0 },
                      { name: "Experience", score: res.subscores?.experience_score ?? 0 },
                      { name: "Education", score: res.subscores?.education_score ?? 0 },
                      { name: "Certifications", score: res.subscores?.certification_score ?? 0 },
                      { name: "Projects", score: res.subscores?.projects_score ?? 0 },
                      { name: "ATS Format", score: res.ats_formatting_score ?? 0 },
                      { name: "Final Score", score: res.overall_score ?? 0 },
                    ]}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>

            {/* ========================== SKILL MATCH PANEL ========================== */}
            <GlassCard className="p-8">
              <h2 className="font-bold text-2xl mb-4">Skill Breakdown 🔍</h2>

              <div className="grid md:grid-cols-2 gap-10">
                {/* Present Skills */}
                <div>
                  <h3 className="font-semibold text-green-700 text-lg">✔ Present Skills</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {res.skills_match?.present?.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm shadow"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h3 className="font-semibold text-red-700 text-lg">❗ Missing Skills</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {res.skills_match?.missing?.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm shadow"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* ========================== RECOMMENDATIONS ========================== */}
            <GlassCard className="p-8 border-red-200">
              <h2 className="font-bold text-xl mb-4 text-red-600">
                📌 Improvement Suggestions
              </h2>

              <ul className="space-y-2 text-gray-800">
                {res.recommendations?.map((x: any, i: number) => (
                  <li key={i}>• {x}</li>
                ))}
              </ul>

              <h3 className="font-bold text-lg mt-6 text-purple-700">
                🚀 Highest Impact Fixes
              </h3>

              <ul className="space-y-1 mt-3">
                {res.top_improvements?.map((x: any, i: number) => (
                  <li key={i} className="font-semibold text-red-500">
                    ⨀ {x}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        )}
      </div>
    </section>
  );
}

/* --------------------- Glass Card Component --------------------- */

function GlassCard({ children, className = "" }: any) {
  return (
    <Card
      className={`p-6 rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all ${className}`}
    >
      {children}
    </Card>
  );
}
