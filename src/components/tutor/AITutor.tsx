import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  Settings,
  Trash2,
  Lightbulb,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AITutorService } from '../../services/ai/aiTutorService';
import type { TutorMessage } from '../../types';
import { MathView } from '../common/MathView';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

const SAMPLE_PROMPTS = [
  'Explain why y = x^2 forms a parabola.',
  'Differentiate x^3 - 4x + 1 step-by-step.',
  'Explain integration using a simple geometric example.',
  'What happens when I change the coefficient in y = a*x^2?',
  'Generate a practice problem on quadratic equations.',
];

export const AITutor: React.FC = () => {
  const { aiConfig, equations, selectedEquationId, setActiveSection } = useAppStore();

  const selectedEquation = equations.find((eq) => eq.id === selectedEquationId);

  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to MathVision AI Tutor

I am your interactive mathematical tutor, backed by an exact symbolic and numerical computation engine.

Ask me conceptual questions, request step-by-step derivations, or generate practice questions. All calculations are verified by the local mathematical engine to prevent hallucinations.`,
      timestamp: Date.now(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || inputText;
    if (!q.trim() || isLoading) return;

    const userMsg: TutorMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await AITutorService.askTutor(
        q,
        aiConfig,
        selectedEquation?.rawInput
      );
      setMessages((prev) => [...prev, response]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `An error occurred while generating explanation: ${err?.message || 'Unknown error'}.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: 'Conversation history cleared. How can I help you explore mathematics today?',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="rounded-md border border-border bg-panel overflow-hidden flex flex-col h-[680px]">
      {/* Tutor Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-panel-hover/50 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-panel text-text-main border border-border flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-main flex items-center gap-1.5">
              MathVision AI Mathematics Tutor
              <Badge variant="primary" className="text-[10px]">
                {aiConfig.provider === 'local-tutor' ? 'Local Engine Tutor' : aiConfig.provider}
              </Badge>
            </h3>
            <p className="text-[11px] text-text-muted">
              {aiConfig.apiKey ? 'Connected to AI API + Local Engine' : 'Running locally in-browser'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection('settings')}
            title="Configure AI Provider"
          >
            <Settings className="w-3 h-3 mr-1 text-text-muted" />
            <span className="hidden sm:inline text-xs">AI Settings</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5 text-text-muted hover:text-text-main" />
          </Button>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 text-xs leading-relaxed ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-panel text-text-main border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-md p-3 space-y-1.5 ${
                msg.role === 'user'
                  ? 'bg-text-main text-background ml-10 font-medium'
                  : 'bg-background border border-border text-text-main mr-10'
              }`}
            >
              <div className="prose prose-invert max-w-none text-xs">
                <MathView math={msg.content} />
              </div>

              {/* Verified computation badge */}
              {msg.verifiedMath && (
                <div className="mt-2 pt-1.5 border-t border-border/70 flex items-center gap-1.5 text-[11px] text-text-muted">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-text-main" />
                  <span>
                    Verified via Mathematical Engine: <code className="text-text-main">{msg.verifiedMath.output}</code>
                  </span>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-md bg-panel text-text-main border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 text-xs">
            <div className="w-6 h-6 rounded-md bg-panel text-text-main border border-border flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="rounded-md p-2.5 bg-background border border-border text-text-muted flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-text-main animate-pulse" />
              <span>Verifying mathematics and generating explanation...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts pills */}
      <div className="px-4 py-1.5 border-t border-border/60 bg-panel-hover/30 flex items-center gap-1 overflow-x-auto text-xs">
        <span className="text-text-muted flex items-center gap-1 whitespace-nowrap mr-0.5 font-bold">
          <Lightbulb className="w-3 h-3 text-text-muted" /> Suggestions:
        </span>
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="px-2 py-0.5 rounded-sm bg-panel border border-border hover:bg-panel-hover text-text-muted hover:text-text-main whitespace-nowrap transition-colors text-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-3 border-t border-border bg-panel flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask a mathematics question or concept explanation..."
          disabled={isLoading}
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main placeholder-text-muted/60 focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border disabled:opacity-50"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
