/***********************************************************************************************
 🔥 AI INTERVIEW PREP — WITH CHAT HISTORY & POST-INTERVIEW ANALYSIS
***********************************************************************************************/
import { useState, useRef } from "react";
import { generateInterviewQA } from "../../api/interview";

import { Mic, Square, Star, Target, Download, BrainCircuit, PlusCircle, LogOut } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionTrigger, AccordionContent, AccordionItem } from "@/components/ui/accordion";


export default function InterviewPrepSection() {

  /***************** STATES *****************/
  const [jobTitle,setJobTitle] = useState("");
  const [jobDesc,setJobDesc]   = useState("");
  const [difficulty,setDifficulty] = useState("beginner");
  const [data,setData] = useState<any | null>(null);
  const [loading,setLoading] = useState(false);

  /***************** MIC STATES *****************/
  const [speech,setSpeech] = useState("");
  const [listening,setListening] = useState(false);
  const [feedback,setFeedback] = useState<any | null>(null);
  const recognitionRef = useRef<any>(null);

  /***************** INTERVIEW CHAT & ANALYSIS *****************/
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [interviewAnalysis, setInterviewAnalysis] = useState<any | null>(null);

  
/* ========================================================================
   🚀 Generate Interview Questions
======================================================================== */
async function generateInterview(){
  setLoading(true);
  try{
    const r = await generateInterviewQA(jobTitle,difficulty);
    setData(r);
    setFeedback(null);
    setSpeech("");
    setChatHistory([]);
    setInterviewEnded(false);
    setInterviewAnalysis(null);
  }finally{ setLoading(false); }
}

async function more(){
  const r = await generateInterviewQA(jobTitle,difficulty);
  setData((p:any)=>({...p,questions:[...p.questions,...r.questions]}));
}

async function aiAnswer(q:any){
  const r = await generateInterviewQA(q.question,"answer");
  q.ai_answer = r.answer;
  setData({...data});
}


/* ========================================================================
   🎤 MICROPHONE — START RECORDING
======================================================================== */
async function startRecording(){
  try{
    await navigator.mediaDevices.getUserMedia({ audio:true });

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!SR) return alert("❌ SpeechRecognition not supported in this browser");

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    recognitionRef.current = rec;
    setListening(true);
    setSpeech("");

    rec.start();
    rec.onresult = (e:any)=>{
      let t=""; 
      for(let i=0;i<e.results.length;i++) t+=e.results[i][0].transcript+" ";
      setSpeech(t);
    };

    rec.onerror = ()=> alert("⚠ Allow mic access from browser 🔒 icon!");
    rec.onend   = ()=> setListening(false);

  }catch{
    alert("⚠ MICROPHONE BLOCKED — Enable from Browser URL Bar manually");
  }
}


/* ========================================================================
   ⛔ STOP SPEAKING & SCORE ANSWER
======================================================================== */
function stopRecording(q:any){
  recognitionRef.current?.stop();
  setListening(false);
  evaluateAnswer(q);
}


/* ========================================================================
   🧠 FUZZY AI SCORING — More accurate than before 💯
======================================================================== */
function evaluateAnswer(q:any){

  const spoken = speech.toLowerCase().trim();
  const points = q.expected_answer_points.map((pt:string)=> pt.toLowerCase());

  if(spoken.split(" ").length < 6){
    return setFeedback({
      score: 0,
      remark:"⚠ Very short answer — Try explaining more",
      stars: 0
    });
  }

  let matched = 0;
  points.forEach(pt=>{
    const words = pt.split(" ");
    let wordMatchCount = 0;
    words.forEach(w=>{
      if(spoken.includes(w)) wordMatchCount++;
    });
    const accuracy = (wordMatchCount / words.length) * 100;
    if(accuracy >= 60) matched++;
  });

  let percent = Math.round((matched / points.length) * 100);
  if(percent < 30 && spoken.length>50) percent = percent - 10;

  const feedback_obj = {
    score: percent,
    stars: Math.ceil(percent/20),
    remark:
      percent>=85 ? "🔥 Outstanding" :
      percent>=70 ? "⚡ Strong Explanation" :
      percent>=50 ? "🙂 Decent — Can Improve" :
      percent>=30 ? "📌 Weak — Add more details" :
                    "❗ Poor — Try covering key points"
  };

  setFeedback(feedback_obj);

  // Add to chat history
  setChatHistory([...chatHistory, {
    type: "question",
    question: q.question,
    timestamp: new Date().toLocaleTimeString()
  }, {
    type: "answer",
    answer: speech,
    score: percent,
    remark: feedback_obj.remark,
    timestamp: new Date().toLocaleTimeString()
  }]);
}


/* ========================================================================
   🏁 END INTERVIEW & ANALYZE PERFORMANCE
======================================================================== */
function endInterview(){
  if(chatHistory.length === 0){
    alert("No answers recorded yet!");
    return;
  }

  const answers = chatHistory.filter((c:any) => c.type === "answer");
  const avgScore = Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length);
  
  const analysis = {
    totalQuestions: answers.length,
    averageScore: avgScore,
    performanceLevel: 
      avgScore >= 85 ? "🔥 Excellent" :
      avgScore >= 70 ? "⚡ Very Good" :
      avgScore >= 50 ? "🙂 Good" :
      avgScore >= 30 ? "📌 Fair" :
                       "❗ Needs Improvement",
    strengths: answers.filter((a:any) => a.score >= 70).length,
    weakAreas: answers.filter((a:any) => a.score < 50).length,
    chatHistory: chatHistory
  };

  setInterviewAnalysis(analysis);
  setInterviewEnded(true);
}


function resetInterview(){
  setInterviewEnded(false);
  setInterviewAnalysis(null);
  setChatHistory([]);
  setData(null);
  setFeedback(null);
  setSpeech("");
}


const PDF = ()=> window.print();


/**************************************************************************************************
 UI — HERO STYLE + GLASS CARDS + CHAT INTERFACE
**************************************************************************************************/
return(
<section id="interview" className="relative min-h-screen py-28 flex justify-center items-start">

  {/* Matching Hero Gradient BG */}
  <div className="absolute inset-0 gradient-hero-bg"/>
  <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/25 blur-3xl animate-pulse-slow"/>
  <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/25 blur-3xl animate-pulse-slow"/>
  <div className="absolute inset-0 opacity-[0.05]"
       style={{backgroundImage:`linear-gradient(hsl(var(--foreground)) 1px,transparent 1px),
                               linear-gradient(90deg,hsl(var(--foreground)) 1px,transparent 1px)`,
               backgroundSize:"50px 50px"}}/>


  <div className="relative container px-6">

    {/* HEADER */}
    <div className="text-center">
      <Badge className="px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg">
        ⚡ AI INTERVIEW LAB
      </Badge>

      <h1 className="text-5xl font-extrabold mt-4">
        Crack Interviews with <span className="gradient-text">AI Precision</span>
      </h1>

      <p className="text-lg opacity-85 mt-3">Speak your answer — AI listens + evaluates intelligently</p>
    </div>


    {/* POST-INTERVIEW ANALYSIS */}
    {interviewEnded && interviewAnalysis && (
      <Card className="mt-16 glass-card rounded-2xl p-8 shadow-2xl border-white/30 max-w-3xl mx-auto">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-3xl">📊 Interview Performance Review</CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 mt-6">
          {/* STATS GRID */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-2xl text-center shadow-md">
              <p className="text-3xl font-bold text-purple-700">{interviewAnalysis.averageScore}%</p>
              <p className="text-sm text-purple-600 mt-2">Average Score</p>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-2xl text-center shadow-md">
              <p className="text-3xl font-bold text-blue-700">{interviewAnalysis.totalQuestions}</p>
              <p className="text-sm text-blue-600 mt-2">Questions Answered</p>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-2xl text-center shadow-md">
              <p className="text-3xl font-bold text-green-700">{interviewAnalysis.strengths}</p>
              <p className="text-sm text-green-600 mt-2">Strong Answers</p>
            </div>

            <div className="bg-gradient-to-br from-red-100 to-red-50 p-6 rounded-2xl text-center shadow-md">
              <p className="text-3xl font-bold text-red-700">{interviewAnalysis.weakAreas}</p>
              <p className="text-sm text-red-600 mt-2">Areas to Improve</p>
            </div>
          </div>

          {/* PERFORMANCE BADGE */}
          <div className="text-center p-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl shadow-inner">
            <p className="text-4xl font-bold mb-3">{interviewAnalysis.performanceLevel}</p>
            <p className="text-gray-700">
              {interviewAnalysis.averageScore >= 85 ? "Outstanding performance! Ready for real interviews." :
               interviewAnalysis.averageScore >= 70 ? "Great job! Keep practicing to improve weak areas." :
               interviewAnalysis.averageScore >= 50 ? "Good effort. Focus on providing more detailed answers." :
               "Keep practicing! Work on covering key points in your answers."}
            </p>
          </div>

          {/* CHAT HISTORY */}
          <div>
            <h3 className="font-semibold text-xl mb-4">💬 Interview Transcript</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto bg-white/50 p-4 rounded-2xl">
              {interviewAnalysis.chatHistory.map((msg: any, idx: number) => (
                <div key={idx} className={`flex ${msg.type === "answer" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-md ${
                    msg.type === "answer" 
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" 
                      : "bg-gray-200 text-gray-900"
                  }`}>
                    {msg.type === "question" ? (
                      <p className="font-semibold text-sm">{msg.question}</p>
                    ) : (
                      <div>
                        <p className="text-sm mb-2">{msg.answer}</p>
                        <div className="flex gap-2 items-center mt-2 text-xs opacity-90">
                          <span className="font-semibold">{msg.score}%</span>
                          <span>{msg.remark}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 justify-center">
            <Button onClick={resetInterview} className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 rounded-full text-lg">
              🔄 Start New Interview
            </Button>
            <Button variant="outline" onClick={PDF} className="px-8 py-3 rounded-full text-lg">
              📥 Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    )}


    {/* MAIN INTERVIEW GRID */}
    {!interviewEnded && (
    <div className="mt-16 grid md:grid-cols-2 gap-10">


      {/* LEFT INPUT CARD */}
      <Card className="glass-card rounded-2xl p-6 shadow-2xl border-white/30">
        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit/> Generate Questions</CardTitle></CardHeader>

        <CardContent className="space-y-5">

          <Input className="h-12 rounded-xl shadow-inner"
                 placeholder="Role e.g ML Engineer"
                 value={jobTitle} onChange={e=>setJobTitle(e.target.value)}/>

          <Textarea className="min-h-[110px] rounded-xl shadow-inner"
                    placeholder="Optional: paste job description..."
                    value={jobDesc} onChange={e=>setJobDesc(e.target.value)}/>

          <div className="flex gap-3">
            {["beginner","intermediate","advanced"].map(lvl=>(
              <Button key={lvl}
                onClick={()=>setDifficulty(lvl)}
                variant={difficulty===lvl?"default":"outline"}
                className={`rounded-full capitalize ${
                  difficulty===lvl?"bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg":""
                }`}
              >{lvl}</Button>
            ))}
          </div>

          <Button className="w-full h-12 text-lg rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600"
                  disabled={!jobTitle||loading}
                  onClick={generateInterview}>
            {loading?"Generating...":"🚀 Generate Interview"}
          </Button>
        </CardContent>
      </Card>

      
      {/* RIGHT — QUESTIONS & MIC */}
      {!data && (
        <Card className="h-[470px] bg-white/30 rounded-2xl shadow-lg flex items-center justify-center">
          <p className="text-lg opacity-70">Enter role → Generate Interview</p>
        </Card>
      )}

      {data && (
        <Card className="glass-card rounded-2xl shadow-2xl border-white/50 flex flex-col">
          <CardHeader className="flex justify-between items-center border-b bg-white/60 py-5">
            <CardTitle>🎯 {data.questions.length} Practice Questions</CardTitle>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full flex gap-1" onClick={more}><PlusCircle size={14}/>More</Button>
              <Button size="sm" variant="outline" className="rounded-full flex gap-1" onClick={PDF}><Download size={14}/>PDF</Button>
              <Button size="sm" className="rounded-full flex gap-1 bg-red-600 text-white hover:bg-red-700" onClick={endInterview}><LogOut size={14}/>End Interview</Button>
            </div>
          </CardHeader>

          
          <CardContent className="px-3 flex-1 overflow-y-auto">
            <Accordion type="single" collapsible>

              {data.questions.map((q:any,i:number)=>(
                <AccordionItem key={i} value={`q${i}`} className="hover:bg-white/60 rounded-xl">

                  <AccordionTrigger className="px-6 py-4 flex gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 font-semibold">{i+1}</div>
                    <div className="flex-1">
                      <p className="font-semibold">{q.question}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge>{q.topic}</Badge>
                        <Badge variant="secondary">{q.difficulty}</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>


                  <AccordionContent className="bg-white/70 px-6 py-6 space-y-6">

                    {/* AI Answer */}
                    <div>
                      <Button size="sm" className="rounded-full shadow" onClick={()=>aiAnswer(q)}>✨ AI Answer</Button>
                      {q.ai_answer && <p className="bg-blue-50 mt-3 p-4 rounded-xl text-sm">{q.ai_answer}</p>}
                    </div>


                    {/* 🎤 Start/Stop Recording */}
                    <div className="flex gap-3">
                      {!listening && <Button size="sm" className="bg-green-600 text-white rounded-full hover:bg-green-700" onClick={startRecording}>🎙 Start Answer</Button>}
                      {listening   && <Button size="sm" className="bg-red-600 text-white rounded-full flex gap-1 hover:bg-red-700" onClick={()=>stopRecording(q)}><Square size={14}/>Stop</Button>}
                    </div>

                    {/* Spoken Text with Chat Bubble Style */}
                    {speech && (
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-3xl rounded-tr-none shadow-lg max-w-md">
                          <p className="text-sm">{speech}</p>
                        </div>
                      </div>
                    )}


                    {/* SCORES */}
                    {feedback && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 shadow-inner">
                        <p className="text-lg font-semibold">{feedback.remark}</p>
                        <div className="flex gap-1 mt-2">
                          {Array(feedback.stars).fill(0).map((_, i)=><Star key={i} className="text-yellow-500" fill="yellow"/>)}
                        </div>
                        <p className="text-sm font-bold mt-2 text-indigo-700">Score: {feedback.score}%</p>
                      </div>
                    )}


                    {/* KEY POINTS */}
                    <div>
                      <h4 className="flex gap-2 items-center text-indigo-700 font-semibold"><Target size={18}/> Key Points to Mention</h4>
                      <ul className="ml-6 list-disc mt-2 space-y-1 text-sm">
                        {q.expected_answer_points.map((pt:string, idx: number)=> <li key={idx}>{pt}</li>)}
                      </ul>
                    </div>

                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

    </div>
    )}
  </div>
</section>
);
}
