import { useState } from "react";
import { analyzeProResume } from "@/api/resume";

// FIXED IMPORTS 🔥
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from "recharts";

export default function ResumePro() {

  const [pdf,setPdf] = useState<File|null>(null);
  const [jd,setJd] = useState("");
  const [res,setRes] = useState<any>(null);

  const run = async ()=>{
    if(!pdf) return alert("Upload Resume PDF");
    const fd = new FormData();
    fd.append("file",pdf);
    fd.append("job_description",jd);
    setRes(await analyzeProResume(fd));
  };

  return(
    <section className="py-20 container max-w-6xl space-y-10">

      {/* Upload UI */}
      <Card className="p-6 space-y-4 shadow-xl bg-white/80 rounded-2xl">
        <h1 className="text-4xl font-extrabold">AI Resume Intelligence</h1>
        <Input type="file" accept="application/pdf"
          onChange={e=>setPdf(e.target.files?.[0]??null)}/>
        <Textarea placeholder="Paste job description..."
          value={jd} onChange={e=>setJd(e.target.value)}/>
        <Button onClick={run} className="w-full text-lg py-3">
          Analyze Resume 🚀
        </Button>
      </Card>

      {res && (
        <div className="grid md:grid-cols-2 gap-10">

          {/* Radar Heatmap */}
          <Card className="p-6">
            <RadarChart width={400} height={350} data={[
              {item:"Skills",score:res.heatmap.skills},
              {item:"Experience",score:res.heatmap.experience},
              {item:"Format",score:res.heatmap.format},
              {item:"Keywords",score:res.heatmap.keywords},
              {item:"Achievements",score:res.heatmap.achievements}
            ]}>
              <PolarGrid/>
              <PolarAngleAxis dataKey="item"/>
              <PolarRadiusAxis angle={30}/>
              <Radar dataKey="score" stroke="#7C3AED" fill="#7C3AED77"/>
            </RadarChart>
          </Card>

          {/* Bar Metrics */}
          <Card className="p-6">
            <BarChart width={400} height={350} data={[
              {name:"Match %",score:res.skills_match.percentage},
              {name:"ATS Score",score:res.ats_formatting_score},
              {name:"Final Score",score:res.overall_score}
            ]}>
              <XAxis dataKey="name"/> <YAxis/> <Tooltip/>
              <Bar dataKey="score" fill="#3B82F6"/>
            </BarChart>
          </Card>

          {/* Recommendations */}
          <Card className="p-6 col-span-2 space-y-3 bg-white">
            <h2 className="text-2xl font-semibold">📌 Recommendations</h2>
            {res.recommendations.map((x,i)=><li key={i}>{x}</li>)}
            <h2 className="text-xl font-semibold mt-4">🚀 Fix First</h2>
            {res.top_improvements.map((x,i)=><li key={i} className="font-bold text-red-600">{x}</li>)}
          </Card>

        </div>
      )}

    </section>
  );
}
