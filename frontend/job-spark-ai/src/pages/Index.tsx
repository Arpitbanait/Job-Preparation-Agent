import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import ResumeAnalyzerSection from "@/components/sections/ResumeAnalyzerSection";
import  JobSearchSection  from "@/components/sections/JobSearchSection";
import InterviewPrepSection from "@/components/sections/InterviewPrepSection";
import  WorkflowSection  from "@/components/sections/WorkflowSection";
import { Footer } from "@/components/layout/Footer";
import RecruiterChatSection from "@/components/sections/RecruiterChatSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <JobSearchSection />
        <InterviewPrepSection />
        <ResumeAnalyzerSection />
        <WorkflowSection />
        <RecruiterChatSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
