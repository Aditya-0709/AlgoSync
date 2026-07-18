import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/Card.jsx';
import { Switch } from './ui/Switch.jsx';
import { Badge } from './ui/Badge.jsx';
import { useStorage } from '../hooks/useStorage.js';
import { Globe, Code2, Terminal } from 'lucide-react';

export function PlatformManager() {
  const [leetcodeEnabled, setLeetcodeEnabled] = useStorage('platform_leetcode_enabled', true);
  const [gfgEnabled, setGfgEnabled] = useStorage('platform_geeksforgeeks_enabled', true);

  const platforms = [
    {
      id: 'leetcode',
      name: 'LeetCode',
      description: 'Supports leetcode.com and cn.leetcode.com (LeetCode China).',
      hostnames: ['leetcode.com', 'cn.leetcode.com'],
      enabled: leetcodeEnabled,
      onToggle: (checked) => setLeetcodeEnabled(checked),
      iconColor: 'text-[#FFA116]',
      bgAccent: 'bg-[#FFA116]/10 border-[#FFA116]/30',
      svgIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#FFA116]">
          <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
        </svg>
      )
    },
    {
      id: 'geeksforgeeks',
      name: 'GeeksForGeeks',
      description: 'Supports practice.geeksforgeeks.org coding problems.',
      hostnames: ['practice.geeksforgeeks.org'],
      enabled: gfgEnabled,
      onToggle: (checked) => setGfgEnabled(checked),
      iconColor: 'text-[#2F8D46]',
      bgAccent: 'bg-[#2F8D46]/10 border-[#2F8D46]/30',
      svgIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#2F8D46]">
          <path d="M21.533 10.183c-.875-.875-2.095-1.36-3.376-1.36-1.282 0-2.501.485-3.376 1.36L12 12.966l-2.781-2.783c-.875-.875-2.095-1.36-3.376-1.36-1.282 0-2.501.485-3.376 1.36C1.592 11.058 1.107 12.278 1.107 13.56c0 1.281.485 2.501 1.36 3.376.875.875 2.094 1.36 3.376 1.36 1.281 0 2.501-.485 3.376-1.36L12 14.153l2.781 2.783c.875.875 2.095 1.36 3.376 1.36 1.281 0 2.501-.485 3.376-1.36.875-.875 1.36-2.095 1.36-3.376 0-1.282-.485-2.502-1.36-3.377zM5.843 16.59c-.808 0-1.464-.656-1.464-1.464 0-.809.656-1.465 1.464-1.465.809 0 1.465.656 1.465 1.465 0 .808-.656 1.464-1.465 1.464zm12.314 0c-.808 0-1.464-.656-1.464-1.464 0-.809.656-1.465 1.464-1.465.809 0 1.465.656 1.465 1.465 0 .808-.656 1.464-1.464 1.464z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="p-3.5 space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-text-secondary" />
              <span>Active Coding Platforms</span>
            </span>
          </CardTitle>
          <CardDescription>
            Enable or disable automatic submission extraction per supported site.
          </CardDescription>
        </CardHeader>

        <div className="space-y-2.5 pt-1">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 ${
                platform.enabled
                  ? 'bg-card border-border shadow-sm'
                  : 'bg-background/80 border-border/60 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${platform.bgAccent}`}>
                  {platform.svgIcon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">{platform.name}</span>
                    <Badge variant={platform.enabled ? 'success' : 'default'}>
                      {platform.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    {platform.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {platform.hostnames.map((host) => (
                      <span key={host} className="text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded text-text-secondary">
                        {host}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ml-3 shrink-0">
                <Switch
                  checked={platform.enabled}
                  onCheckedChange={(checked) => platform.onToggle(checked)}
                  id={`toggle-${platform.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
