/***********************************************************************************************
 ⚡ AI Job Application Workflow — Premium UI + Hero Background Match
***********************************************************************************************/
import { useState } from "react";
import { generateCoverLetterAPI, sendEmailOAuthAPI } from "@/api/workflow";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, CheckCircle2, Loader2, FileText, Building2, MailCheck } from "lucide-react";

export default function WorkflowSection() {

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");

  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");

  const [hrEmail, setHrEmail] = useState("");
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState(false);


  /********************** STEP 1 — Generate Cover Letter **********************/
  const handleGenerate = async () => {
    if (!resumeFile) return alert("Upload Resume First");
    if (!jobDescription || !role || !company) return alert("Fill all fields");

    setLoading(true);
    try {
      const res = await generateCoverLetterAPI(resumeFile, jobDescription, role, company);
      setGeneratedSubject(res.cover_letter.subject);
      setGeneratedBody(res.cover_letter.body);
      setStep(1);
    } catch {
      alert("Cover letter generation failed");
    }
    setLoading(false);
  };


  /********************** STEP 2 — Send Email **********************/
  const handleSendEmail = async () => {
    if (!hrEmail) return alert("Enter HR Email");
    setLoading(true);

    try {
      await sendEmailOAuthAPI(hrEmail, generatedSubject, generatedBody);
      setStep(2);
    } catch {
      alert("Email sending failed — check backend");
    }

    setLoading(false);
  };



  /**************************************************************************************************
   🔥 FINAL UI — EXACT SAME BACKGROUND AS HERO SECTION + NEON CARD
  **************************************************************************************************/
  return (
    <section id="workflow" className="relative py-28 min-h-screen">

      {/* SAME HERO BACKGROUND */}
      <div className="absolute inset-0 gradient-hero-bg"></div>
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 blur-3xl rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-accent/20 blur-3xl rounded-full animate-pulse-slow"></div>

      {/* GRID OVERLAY */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:`linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg,hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize:"50px 50px"
        }}
      ></div>

      <div className="relative container px-6">


        {/* 🏆 SECTION HEADER */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <p className="px-4 py-1 rounded-full inline-block text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow">
            End-to-End Job Application Workflow
          </p>

          <h1 className="text-5xl font-extrabold mt-4">
            Apply to Jobs with <span className="gradient-text">One Click</span>
          </h1>

          <p className="text-lg text-muted-foreground mt-3">
            Upload Resume → Generate AI Cover Letter → Send Email to HR Instantly.
          </p>
        </div>



        {/* CARD */}
        <Card className="glass-card max-w-3xl mx-auto shadow-2xl border-white/30 rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/60 py-6 border-b">
            <CardTitle className="text-xl flex gap-2 items-center">
              <Sparkles className="text-purple-600"/>
              AI Auto-Apply Tool
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-8">


            {/* ====================== STEP 0 — Generate ====================== */}
            {step === 0 && (
              <div className="space-y-6 animate-fade-in">

                <div className="bg-white/60 p-4 rounded-xl shadow-inner border">
                  <Input type="file" accept="application/pdf" onChange={e=>setResumeFile(e.target.files?.[0] || null)} />
                </div>

                <Textarea 
                  placeholder="Paste Job Description..."
                  value={jobDescription} 
                  onChange={e=>setJobDescription(e.target.value)}
                  className="rounded-xl shadow-inner min-h-[120px]"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Role (ex: AI Engineer)" value={role} onChange={e=>setRole(e.target.value)} className="rounded-xl shadow-inner" />
                  <Input placeholder="Company (ex: Google)" value={company} onChange={e=>setCompany(e.target.value)} className="rounded-xl shadow-inner" />
                </div>

                <Button className="w-full h-12 rounded-xl text-lg bg-gradient-to-r from-purple-500 to-blue-600 shadow-xl hover:scale-[1.02]"
                        onClick={handleGenerate} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin"/> : <FileText className="mr-2"/>}
                  Generate Cover Letter
                </Button>
              </div>
            )}



            {/* ====================== STEP 1 — Mailing Page ====================== */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">

                <Input value={generatedSubject} readOnly className="font-semibold rounded-xl bg-white/70 border shadow-inner"/>
                <Textarea value={generatedBody} readOnly className="min-h-[260px] rounded-xl shadow-inner"/>

                <div className="bg-white/60 p-4 rounded-xl shadow-inner border">
                  <Input placeholder="HR Email Address" value={hrEmail} onChange={e=>setHrEmail(e.target.value)}/>
                </div>

                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl hover:scale-[1.02]"
                        onClick={handleSendEmail} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin"/> : <MailCheck className="mr-2"/>}
                  Send To HR
                </Button>
              </div>
            )}



            {/* ====================== STEP 2 — Success ====================== */}
            {step === 2 && (
              <div className="text-center py-12 animate-fade-in">
                <CheckCircle2 className="text-green-500 w-16 h-16 mx-auto"/>
                <h2 className="text-2xl font-bold mt-3">Email Delivered Successfully 🎉</h2>
                <p className="opacity-80 mt-1">HR has received your cover letter.</p>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </section>
  );
}
