import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/Card.jsx';
import { Switch } from './ui/Switch.jsx';
import { Select } from './ui/Select.jsx';
import { useStorage } from '../hooks/useStorage.js';
import { Sliders, FileCode2, RefreshCcw, FileText, Layers } from 'lucide-react';

export function Settings() {
  const [solutionUploadMode, setSolutionUploadMode] = useStorage('solution_upload_mode', 'overwrite');
  const [solutionType, setSolutionType] = useStorage('solution_type_picker_last_selection', 'optimal');
  const [autoSync, setAutoSync] = useStorage('auto_sync_enabled', true);
  const [autoReadme, setAutoReadme] = useStorage('auto_readme_enabled', true);

  const solutionTypeOptions = [
    { value: 'optimal', label: '🔵 Optimal (Default)' },
    { value: 'better', label: '🟡 Better Approach' },
    { value: 'brute_force', label: '🟢 Brute Force' },
    { value: 'custom', label: '⚪ Custom Implementation' },
  ];

  return (
    <div className="p-3.5 space-y-3">
      {/* Upload Strategy Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-text-secondary" />
              <span>Solution Upload Strategy</span>
            </span>
          </CardTitle>
          <CardDescription>
            Choose how new submissions are committed to your GitHub repository.
          </CardDescription>
        </CardHeader>

        <div className="space-y-2 pt-1">
          <label
            onClick={() => setSolutionUploadMode('overwrite')}
            className={`flex items-start gap-2.5 p-2 rounded border cursor-pointer transition-colors duration-150 ${
              solutionUploadMode === 'overwrite'
                ? 'bg-accent/10 border-accent/40 text-text-primary'
                : 'bg-background border-border text-text-secondary hover:border-text-muted'
            }`}
          >
            <input
              type="radio"
              name="upload_mode"
              checked={solutionUploadMode === 'overwrite'}
              onChange={() => setSolutionUploadMode('overwrite')}
              className="mt-0.5 accent-accent cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-xs font-medium text-text-primary block">Overwrite Mode</span>
              <span className="text-[11px] text-text-secondary block mt-0.5 leading-snug">
                Replaces the existing solution file (`Solution.py`, `Solution.cpp`) with your latest accepted submission.
              </span>
            </div>
          </label>

          <label
            onClick={() => setSolutionUploadMode('multi')}
            className={`flex items-start gap-2.5 p-2 rounded border cursor-pointer transition-colors duration-150 ${
              solutionUploadMode === 'multi'
                ? 'bg-accent/10 border-accent/40 text-text-primary'
                : 'bg-background border-border text-text-secondary hover:border-text-muted'
            }`}
          >
            <input
              type="radio"
              name="upload_mode"
              checked={solutionUploadMode === 'multi'}
              onChange={() => setSolutionUploadMode('multi')}
              className="mt-0.5 accent-accent cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-xs font-medium text-text-primary block">Multi Solution Mode</span>
              <span className="text-[11px] text-text-secondary block mt-0.5 leading-snug">
                Preserves prior versions by committing discrete files (`Optimal.py`, `Better.py`, `BruteForce.py`).
              </span>
            </div>
          </label>
        </div>
      </Card>

      {/* Default Solution Type Picker */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-text-secondary" />
              <span>Default Solution Classification</span>
            </span>
          </CardTitle>
          <CardDescription>
            Pre-selects the complexity tier in the submission overlay prompt.
          </CardDescription>
        </CardHeader>
        <div className="pt-1">
          <Select
            value={solutionType}
            onChange={(val) => setSolutionType(val)}
            options={solutionTypeOptions}
          />
        </div>
      </Card>

      {/* Automation Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-text-secondary" />
              <span>Background Automation</span>
            </span>
          </CardTitle>
          <CardDescription>
            Configure automatic synchronization behavior on accepted submissions.
          </CardDescription>
        </CardHeader>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-text-primary block flex items-center gap-1.5">
                <RefreshCcw className="w-3 h-3 text-text-secondary" />
                Auto Sync Submissions
              </span>
              <span className="text-[11px] text-text-secondary block mt-0.5">
                Automatically commit accepted code to GitHub in real-time.
              </span>
            </div>
            <Switch
              checked={autoSync}
              onCheckedChange={(checked) => setAutoSync(checked)}
              id="toggle-auto-sync"
            />
          </div>

          <div className="border-t border-border/50 pt-2.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-text-primary block flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-text-secondary" />
                Generate Problem README
              </span>
              <span className="text-[11px] text-text-secondary block mt-0.5">
                Create a markdown summary with problem description and constraints.
              </span>
            </div>
            <Switch
              checked={autoReadme}
              onCheckedChange={(checked) => setAutoReadme(checked)}
              id="toggle-auto-readme"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
