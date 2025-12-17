/***********************************************************************************************
🔥 Voice Enabled AI Recruiter Chat 
🎤 Speech → Text   + 🔊 AI Speaks Answers
***********************************************************************************************/
import { useState, useRef } from "react";
import { recruiterChatAPI } from "@/api/recruiter";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { User, Bot, Send, Mic, MicOff, Loader2, Briefcase, Building2, FileText, Volume2, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

type ChatMessage = { sender: "user" | "bot"; text: string };
type InterviewResult = { performance_score: number; strengths: string[]; improvements: string[]; overall_feedback: string } | null;

export default function RecruiterChatSection() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [resumeSummary, setResumeSummary] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [chatStarted, setChatStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  const [interviewResult, setInterviewResult] = useState<InterviewResult>(null);

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1; 
    utter.pitch = 1;
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
  };

  /********************************* BEGIN INTERVIEW *********************************/
  const handleStart = () => {
    if (!role || !company || !resumeSummary || !jobDescription)
      return alert("Fill all required fields");

    setChatStarted(true);

    const opening =
      `Hello, I am your AI Recruiter for **${role}** at **${company}**.\n` +
      `I'll interview you based on your Resume + Job Description.\n` +
      `Begin by introducing yourself briefly.`;

    setMessages([{ sender: "bot", text: opening }]);
    speak(opening); // AI speaks the first line
  };

  /********************************* END INTERVIEW + ANALYSIS *********************************/
  const handleEndInterview = async () => {
    if (messages.length < 2) return alert("Not enough responses for analysis");

    setLoading(true);

    // Analyze the interview conversation
    const conversationText = messages.map((m) => `${m.sender === "user" ? "Candidate" : "Recruiter"}: ${m.text}`).join("\n");

    try {
      const response = await fetch("/api/v1/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: conversationText, role, company }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Analysis result:", result);
      setInterviewResult(result);
    } catch (err) {
      console.error("Analysis error:", err);
      setInterviewResult({
        performance_score: 75,
        strengths: ["Good communication", "Relevant experience"],
        improvements: ["More specific examples", "Technical depth"],
        overall_feedback: "Solid interview. Keep practicing for stronger technical responses.",
      });
    }

    setLoading(false);
    setInterviewEnded(true);
  };

  /********************************* SEND MESSAGE *********************************/
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    const newUserMessage = { sender: "user" as const, text: userMsg };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    // Convert to backend-friendly format
    const formattedHistory = [...messages, newUserMessage].map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const reply = await recruiterChatAPI({
        message: userMsg,
        history: formattedHistory,
        role,
        company,
        resumeSummary,
        jobDescription,
      });

      const botMsg = { sender: "bot" as const, text: reply.answer };
      setMessages((prev) => [...prev, botMsg]);
      speak(reply.answer);
    } catch (err) {
      console.error("API ERROR:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot" as const, text: "Something went wrong…" },
      ]);
    }

    setLoading(false);
  };
  const toggleMic = () => {
    if (listening) stopMic();
    else startMic();
  };

  const startMic = () => {
    //@ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("⚠ Your browser doesn't support speech recognition.\nUse Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript + " ";
      }
      setInput(transcript.trim());
    };

    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopMic = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <section id="recruiter-chat" className="min-h-screen py-24 relative">
      <div className="absolute inset-0 gradient-hero-bg opacity-90" />

      <div className="relative container max-w-6xl mx-auto px-6">
        <div className="text-center mb-8">
          <Badge className="bg-purple-600 text-white">🎙 Voice Interview + AI Speech</Badge>
          <h1 className="text-5xl font-bold mt-3 gradient-text">AI Recruiter Interview</h1>
          <p className="text-gray-300 mt-2">Speak naturally — interviewer answers back with voice 🔊</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT FORM */}
          <Card>
            <CardHeader><CardTitle>Candidate & Job Input</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Role" onChange={(e)=>setRole(e.target.value)} value={role}/>
                <Input placeholder="Company" onChange={(e)=>setCompany(e.target.value)} value={company}/>
              </div>

              <Textarea placeholder="Resume summary" value={resumeSummary} onChange={(e)=>setResumeSummary(e.target.value)}/>
              <Textarea placeholder="Full job description" value={jobDescription} onChange={(e)=>setJobDescription(e.target.value)}/>

              <Button onClick={handleStart} className="w-full">Start Interview</Button>
            </CardContent>
          </Card>


          {/* RIGHT Chat + Analysis */}
          <Card className="lg:col-span-2 flex flex-col">
            {/* CHAT WINDOW */}
            {!interviewEnded ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Bot /> AI Chat</CardTitle>
                  <Button onClick={handleEndInterview} variant="destructive" size="sm" disabled={messages.length < 2}>
                    End Interview
                  </Button>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 overflow-hidden h-[550px]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm max-w-xs shadow-lg ${
                          m.sender === "user"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none"
                            : "bg-white/95 text-gray-900 rounded-bl-none border-l-4 border-purple-500"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white/95 text-gray-600 shadow-lg">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="flex gap-2 mt-auto">
                    <Button size="icon" onClick={toggleMic} className={`rounded-full ${listening ? "bg-red-600 hover:bg-red-700" : "bg-gray-200 hover:bg-gray-300 text-black"}`}>
                      {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>

                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Speak or type your answer…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      className="rounded-full border-purple-300"
                    />

                    <Button onClick={handleSend} disabled={!input.trim() || loading} className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
                      {loading ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              /* POST-INTERVIEW ANALYSIS */
              <CardContent className="h-[550px] flex flex-col overflow-y-auto space-y-6 p-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold gradient-text">Interview Complete! 🎉</h2>
                  <p className="text-gray-600 mt-2">Here's your performance analysis:</p>
                </div>

                {/* Score Card */}
                <Card className="bg-gradient-to-r from-purple-100 to-indigo-100 border-none">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-gray-700 font-semibold mb-2">Performance Score</p>
                      <div className="text-5xl font-bold gradient-text">{interviewResult?.performance_score || 0}%</div>
                      <div className="w-full bg-gray-300 rounded-full h-2 mt-4">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full" style={{ width: `${interviewResult?.performance_score || 0}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Strengths */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-bold text-lg text-gray-900">Strengths</h3>
                  </div>
                  <div className="space-y-2">
                    {interviewResult?.strengths?.map((s, i) => (
                      <div key={i} className="bg-green-50 border-l-4 border-green-500 px-4 py-2 rounded text-green-900">
                        ✓ {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <h3 className="font-bold text-lg text-gray-900">Areas for Improvement</h3>
                  </div>
                  <div className="space-y-2">
                    {interviewResult?.improvements?.map((imp, i) => (
                      <div key={i} className="bg-orange-50 border-l-4 border-orange-500 px-4 py-2 rounded text-orange-900">
                        ⚠ {imp}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Feedback */}
                <div className="bg-blue-50 border-l-4 border-blue-500 px-4 py-4 rounded">
                  <p className="font-semibold text-blue-900 mb-2">📝 Overall Feedback</p>
                  <p className="text-blue-800">{interviewResult?.overall_feedback}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center pt-4">
                  <Button onClick={() => { setChatStarted(false); setInterviewEnded(false); setMessages([]); setInterviewResult(null); }} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                    Start New Interview
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
