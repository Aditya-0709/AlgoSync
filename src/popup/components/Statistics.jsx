import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/Card.jsx';
import { useStorage } from '../hooks/useStorage.js';
import { BarChart3, Award, CheckCircle2, Flame } from 'lucide-react';

export function Statistics() {
  const [stats] = useStorage('stats', { solved: 0, easy: 0, medium: 0, hard: 0, streak: { current: 0 } });

  const total = stats?.solved || 0;
  const easy = stats?.easy || 0;
  const medium = stats?.medium || 0;
  const hard = stats?.hard || 0;
  const streak = stats?.streak?.current || 0;

  const easyPercent = total > 0 ? Math.round((easy / total) * 100) : 0;
  const mediumPercent = total > 0 ? Math.round((medium / total) * 100) : 0;
  const hardPercent = total > 0 ? Math.round((hard / total) * 100) : 0;

  return (
    <div className="p-3.5 space-y-3">
      {/* Overview Counter */}
      <Card className="bg-gradient-to-br from-card to-card-hover border-border">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary block">
              Cumulative Progress
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-text-primary tracking-tight">{total}</span>
              <span className="text-xs text-text-secondary">problems solved</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Clean Progress Bar */}
        {total > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-background">
              {easy > 0 && <div style={{ width: `${easyPercent}%` }} className="bg-[#22C55E]" title={`Easy: ${easy}`} />}
              {medium > 0 && <div style={{ width: `${mediumPercent}%` }} className="bg-[#EAB308]" title={`Medium: ${medium}`} />}
              {hard > 0 && <div style={{ width: `${hardPercent}%` }} className="bg-[#EF4444]" title={`Hard: ${hard}`} />}
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block" /> Easy ({easy})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#EAB308] inline-block" /> Medium ({medium})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block" /> Hard ({hard})
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Difficulty Breakdown Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-[#22C55E]/30 bg-[#22C55E]/5 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-[#22C55E] uppercase tracking-wider">Easy</span>
          <div className="mt-2">
            <span className="text-lg font-bold text-text-primary block">{easy}</span>
            <span className="text-[10px] text-text-secondary">{easyPercent}% of total</span>
          </div>
        </Card>

        <Card className="border-[#EAB308]/30 bg-[#EAB308]/5 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-[#EAB308] uppercase tracking-wider">Medium</span>
          <div className="mt-2">
            <span className="text-lg font-bold text-text-primary block">{medium}</span>
            <span className="text-[10px] text-text-secondary">{mediumPercent}% of total</span>
          </div>
        </Card>

        <Card className="border-[#EF4444]/30 bg-[#EF4444]/5 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-[#EF4444] uppercase tracking-wider">Hard</span>
          <div className="mt-2">
            <span className="text-lg font-bold text-text-primary block">{hard}</span>
            <span className="text-[10px] text-text-secondary">{hardPercent}% of total</span>
          </div>
        </Card>
      </div>

      {/* Streak / Consistency Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#FFA116]/15 border border-[#FFA116]/30 flex items-center justify-center text-[#FFA116]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-text-primary block">Active Sync Streak</span>
              <span className="text-[11px] text-text-secondary">Consecutive days with submissions</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-text-primary block">{streak} days</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
