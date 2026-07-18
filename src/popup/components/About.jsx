import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Github, ExternalLink, ShieldCheck, Heart, GitBranch, Bug } from 'lucide-react';

export function About() {
  return (
    <div className="p-3.5 space-y-3">
      {/* Brand & Version Card */}
      <Card className="text-center py-5 space-y-2.5">
        <div className="w-12 h-12 mx-auto rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-sm">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 18l6-6-6-6" />
            <path d="M8 6l-6 6 6 6" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-text-primary tracking-tight">AlgoSync</h2>
          <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-mono bg-background border border-border text-accent">
            Version 2.0.9 (Production)
          </span>
        </div>
        <p className="text-xs text-text-secondary max-w-[280px] mx-auto leading-relaxed">
          The ultimate automated code synchronization engine for developers solving coding challenges across web platforms.
        </p>
      </Card>

      {/* Author & Repository Links */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-text-secondary" />
              <span>Project & Community</span>
            </span>
          </CardTitle>
          <CardDescription>
            Created and maintained by open-source contributors.
          </CardDescription>
        </CardHeader>

        <div className="space-y-2 pt-1">
          <a
            href="https://github.com/arunbhardwaj/LeetHub-2.0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded border border-border bg-background hover:border-text-muted transition-colors duration-150 group"
          >
            <div className="flex items-center gap-2.5">
              <Github className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors" />
              <div>
                <span className="text-xs font-medium text-text-primary block">GitHub Repository</span>
                <span className="text-[10px] text-text-secondary block">arunbhardwaj/LeetHub-2.0</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
          </a>

          <a
            href="https://github.com/arunbhardwaj/LeetHub-2.0/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded border border-border bg-background hover:border-text-muted transition-colors duration-150 group"
          >
            <div className="flex items-center gap-2.5">
              <Bug className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors" />
              <div>
                <span className="text-xs font-medium text-text-primary block">Report an Issue</span>
                <span className="text-[10px] text-text-secondary block">Submit bug reports or feature suggestions</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
          </a>
        </div>
      </Card>

      {/* License & Credits */}
      <Card className="bg-card/40 border-border/60">
        <div className="flex items-center justify-between text-[11px] text-text-secondary">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-success" /> MIT License
          </span>
          <span className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-danger fill-danger" /> by Arun Bhardwaj
          </span>
        </div>
      </Card>
    </div>
  );
}
