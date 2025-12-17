import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/20">
      <div className="container px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              <span className="gradient-text">JobSearch</span>
              <span className="text-muted-foreground">.AI</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#resume" className="hover:text-foreground transition-colors">Resume</a>
            <a href="#jobs" className="hover:text-foreground transition-colors">Jobs</a>
            <a href="#interview" className="hover:text-foreground transition-colors">Interview</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Apply</a>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>© 2024 JobSearch.AI. All rights reserved. Built with AI to help you land your dream job.</p>
        </div>
      </div>
    </footer>
  );
}
