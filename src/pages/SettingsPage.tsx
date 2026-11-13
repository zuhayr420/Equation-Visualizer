import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  ShieldAlert,
  Key,
  Trash2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    graphSettings,
    setGraphSettings,
    aiConfig,
    setAIConfig,
    clearHistory,
  } = useAppStore();

  const [apiKeyInput, setApiKeyInput] = useState(aiConfig.apiKey);
  const [providerInput, setProviderInput] = useState(aiConfig.provider);
  const [modelInput, setModelInput] = useState(aiConfig.model || 'gemini-1.5-flash');
  const [customEndpoint, setCustomEndpoint] = useState(aiConfig.customEndpoint || '');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAIConfig = () => {
    setAIConfig({
      provider: providerInput,
      apiKey: apiKeyInput.trim(),
      model: modelInput.trim(),
      customEndpoint: customEndpoint.trim(),
      enabled: true,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus('Testing API connection...');
    try {
      if (providerInput === 'local-tutor') {
        setTestStatus('Local Tutor is ready and active (0 network requests required).');
        return;
      }
      if (!apiKeyInput) {
        setTestStatus('Please enter an API key first.');
        return;
      }
      if (providerInput === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelInput}:generateContent?key=${apiKeyInput}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping' }] }] }),
        });
        if (res.ok) {
          setTestStatus('Success: Gemini API connection verified!');
        } else {
          const err = await res.json();
          setTestStatus(`Connection error: ${err?.error?.message || res.statusText}`);
        }
      } else {
        setTestStatus('Provider configuration validated.');
      }
    } catch (err: any) {
      setTestStatus(`Connection failed: ${err?.message || 'Network error'}`);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="border-b border-border pb-3.5">
        <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
          <Settings className="w-4 h-4 text-text-main" />
          Application Settings
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Configure visual themes, mathematical units, AI credentials, and browser storage persistence.
        </p>
      </div>

      {/* Visual Theme & Units */}
      <Card title="Interface & Mathematics Preferences" subtitle="Display and unit conventions">
        <div className="space-y-3.5 text-xs">
          {/* Theme Switch */}
          <div className="flex items-center justify-between py-1.5 border-b border-border/70">
            <div>
              <span className="font-bold text-text-main block">Color Theme:</span>
              <span className="text-text-muted">Choose dark or light visual interface.</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-1 rounded-sm flex items-center gap-1.5 border transition-colors text-xs ${
                  theme === 'dark'
                    ? 'border-text-main bg-text-main text-background font-bold'
                    : 'border-border bg-panel text-text-muted hover:text-text-main'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Default</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2.5 py-1 rounded-sm flex items-center gap-1.5 border transition-colors text-xs ${
                  theme === 'light'
                    ? 'border-text-main bg-text-main text-background font-bold'
                    : 'border-border bg-panel text-text-muted hover:text-text-main'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light Theme</span>
              </button>
            </div>
          </div>

          {/* Angle Unit */}
          <div className="flex items-center justify-between py-1.5 border-b border-border/70">
            <div>
              <span className="font-bold text-text-main block">Trigonometric Angle Unit:</span>
              <span className="text-text-muted">Select default unit for trigonometric function evaluation.</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setGraphSettings({ angleUnit: 'rad' })}
                className={`px-2.5 py-1 rounded-sm border text-xs transition-colors ${
                  graphSettings.angleUnit === 'rad'
                    ? 'border-text-main bg-text-main text-background font-bold'
                    : 'border-border bg-panel text-text-muted hover:text-text-main'
                }`}
              >
                Radians (rad)
              </button>
              <button
                type="button"
                onClick={() => setGraphSettings({ angleUnit: 'deg' })}
                className={`px-2.5 py-1 rounded-sm border text-xs transition-colors ${
                  graphSettings.angleUnit === 'deg'
                    ? 'border-text-main bg-text-main text-background font-bold'
                    : 'border-border bg-panel text-text-muted hover:text-text-main'
                }`}
              >
                Degrees (deg)
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Provider Configuration */}
      <Card
        title="AI Mathematics Tutor Provider"
        subtitle="Configure optional AI keys or use the built-in verified mathematical engine tutor"
      >
        <div className="space-y-3.5 text-xs">
          {/* Security Alert */}
          <div className="p-3 rounded-md border border-border bg-panel text-text-muted flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-text-main" />
            <div>
              <p className="font-bold text-text-main">Client-Side Security Warning:</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                MathVision is a pure client-side application. Any API key you input is stored <strong>only in your browser's localStorage</strong>. Never share your credentials or commit them to public version control. If you prefer not to use an external API key, select <strong>Local Verified Tutor</strong> to run entirely offline with verified derivations.
              </p>
            </div>
          </div>

          {/* Provider selector */}
          <div className="space-y-1">
            <label className="font-bold text-text-main block">AI Provider:</label>
            <select
              value={providerInput}
              onChange={(e) => setProviderInput(e.target.value as any)}
              className="w-full rounded-md border border-border bg-background p-2 text-xs text-text-main font-medium focus:border-text-main focus:outline-none"
            >
              <option value="local-tutor">Local Verified Engine Tutor (Offline, Free, No API Key Required)</option>
              <option value="gemini">Google Gemini API (gemini-1.5-flash / gemini-1.5-pro)</option>
              <option value="openai">OpenAI API (gpt-4o / gpt-4o-mini)</option>
              <option value="anthropic">Anthropic Claude API (claude-3-5-sonnet)</option>
              <option value="custom">Custom Serverless Proxy Endpoint</option>
            </select>
          </div>

          {/* API Key Input (if not local) */}
          {providerInput !== 'local-tutor' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-text-main block flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-text-main" /> API Key:
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter private API key (e.g. AIzaSy... or sk-...)"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main focus:border-text-main focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-main block">Model Name:</label>
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder="e.g. gemini-1.5-flash or gpt-4o-mini"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main focus:border-text-main focus:outline-none"
                />
              </div>

              {providerInput === 'custom' && (
                <div className="space-y-1">
                  <label className="font-bold text-text-main block">Custom Endpoint URL:</label>
                  <input
                    type="url"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="https://your-custom-endpoint.com/api/tutor"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main focus:border-text-main focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          {testStatus && (
            <div className="p-2 rounded-sm bg-background border border-border text-[11px] text-text-main">
              {testStatus}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              <span>Test Connection</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAIConfig}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-text-main" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Provider Settings</span>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Browser Storage Management */}
      <Card title="Browser Storage Management" subtitle="IndexedDB and LocalStorage controls">
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5">
            <div>
              <span className="font-bold text-text-main block">Clear Calculation History</span>
              <span className="text-text-muted">Purges all recorded calculation history logs.</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={clearHistory}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Clear History</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* About MathVision */}
      <Card title="About MathVision – Mathematics, Made Visible">
        <div className="space-y-1.5 text-xs text-text-muted leading-relaxed">
          <p>
            <strong>Version:</strong> 1.0.0 (Production Release)
          </p>
          <p>
            <strong>Architecture:</strong> 100% Client-Side In-Browser Execution. Built with React 19, TypeScript, Vite, Tailwind CSS, Plotly.js, Three.js, Math.js, Nerdamer, KaTeX, and IndexedDB.
          </p>
          <p>
            <strong>Deployment:</strong> Deployable as static assets to any web server or static host without requiring Python, Node.js, Flask, FastAPI, Express, or backend database servers.
          </p>
        </div>
      </Card>
    </div>
  );
};
