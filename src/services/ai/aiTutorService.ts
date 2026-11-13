import type { AIProviderConfig, TutorMessage } from '../../types';
import { SymbolicEngine } from '../../engines/symbolic/symbolicEngine';
import { NumericalEngine } from '../../engines/numerical/numericalEngine';
import { parseEquation } from '../../engines/parser/expressionParser';

export class AITutorService {
  /**
   * Process a question: first perform local mathematical verification,
   * then either query configured API or produce rich verified local response.
   */
  static async askTutor(
    question: string,
    config: AIProviderConfig,
    activeEquationContext?: string
  ): Promise<TutorMessage> {
    const verifiedMath = this.extractAndVerifyMath(question, activeEquationContext);

    // If an external API key is provided and enabled, call the provider with verified math context
    if (config.enabled && config.apiKey && config.provider !== 'local-tutor') {
      try {
        const responseText = await this.callExternalProvider(question, config, verifiedMath);
        return {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
          verifiedMath: verifiedMath.hasMath
            ? {
                input: verifiedMath.input,
                output: verifiedMath.result,
                status: 'verified',
              }
            : undefined,
        };
      } catch (err: any) {
        console.warn('External AI call failed, falling back to local tutor:', err);
        // Fall back gracefully to verified local tutor
      }
    }

    // Local Verified Mathematics Tutor
    const localContent = this.generateLocalExplanation(question, verifiedMath, activeEquationContext);
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      role: 'assistant',
      content: localContent,
      timestamp: Date.now(),
      verifiedMath: verifiedMath.hasMath
        ? {
            input: verifiedMath.input,
            output: verifiedMath.result,
            status: 'verified',
          }
        : undefined,
    };
  }

  /**
   * Extracts mathematical equations from text and verifies them with our symbolic/numerical engines
   */
  private static extractAndVerifyMath(text: string, contextEq?: string): {
    hasMath: boolean;
    operation: string;
    input: string;
    result: string;
    latexResult?: string;
  } {
    const lower = text.toLowerCase();

    // Look for differentiation
    if (lower.includes('diff') || lower.includes('derivative') || lower.includes("d/dx")) {
      const match = text.match(/(?:of|for|derivative of|differentiate)\s+([a-zA-Z0-9^+\-*/() .]+)/i);
      const expr = match ? match[1].trim() : contextEq || 'x^2';
      try {
        const res = SymbolicEngine.differentiate(expr);
        return {
          hasMath: true,
          operation: 'Differentiation',
          input: expr,
          result: res.finalAnswer,
          latexResult: res.finalAnswerLatex,
        };
      } catch {
        // Fall through
      }
    }

    // Look for integration
    if (lower.includes('integrate') || lower.includes('integral') || lower.includes('antiderivative')) {
      const match = text.match(/(?:of|for|integral of|integrate)\s+([a-zA-Z0-9^+\-*/() .]+)/i);
      const expr = match ? match[1].trim() : contextEq || 'x^2';
      try {
        const res = SymbolicEngine.integrate(expr);
        return {
          hasMath: true,
          operation: 'Integration',
          input: expr,
          result: res.finalAnswer,
          latexResult: res.finalAnswerLatex,
        };
      } catch {
        // Fall through
      }
    }

    // Look for solve / roots
    if (lower.includes('solve') || lower.includes('roots') || lower.includes('zeroes') || lower.includes('=')) {
      const match = text.match(/(?:solve|roots of)\s+([a-zA-Z0-9^+\-*/() =.]+)/i);
      const expr = match ? match[1].trim() : contextEq || 'x^2 - 4 = 0';
      try {
        const res = SymbolicEngine.solveEquation(expr);
        return {
          hasMath: true,
          operation: 'Solve Equation',
          input: expr,
          result: res.finalAnswer,
          latexResult: res.finalAnswerLatex,
        };
      } catch {
        // Fall through
      }
    }

    // If context equation exists, analyze it
    if (contextEq) {
      try {
        const parsed = parseEquation(contextEq);
        if (parsed.isValid && parsed.eval1D) {
          const roots = NumericalEngine.findRoots(parsed.eval1D, -10, 10);
          return {
            hasMath: true,
            operation: 'Context Analysis',
            input: contextEq,
            result: `Roots at x = [${roots.join(', ')}]`,
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      hasMath: false,
      operation: 'None',
      input: '',
      result: '',
    };
  }

  /**
   * Built-in local verified mathematical explanation engine
   */
  private static generateLocalExplanation(
    question: string,
    verifiedMath: { hasMath: boolean; operation: string; input: string; result: string; latexResult?: string },
    activeEquationContext?: string
  ): string {
    const q = question.toLowerCase();

    // Specific concept questions
    if (q.includes('parabola') || (q.includes('x^2') && q.includes('why'))) {
      return `### Why $y = x^2$ Forms a Parabola

A parabola is the locus of all points equidistant from a fixed point (the **focus**) and a fixed line (the **directrix**).

1. **Symmetry**: Because $(-x)^2 = x^2$, the curve is strictly symmetric about the vertical $y$-axis ($f(-x) = f(x)$).
2. **Accelerating Rate of Change**: Notice how rapidly $y$ grows:
   - At $x = 0$, $y = 0$
   - At $x = 1$, $y = 1$ (growth $+1$)
   - At $x = 2$, $y = 4$ (growth $+3$)
   - At $x = 3$, $y = 9$ (growth $+5$)
3. **Constant Second Derivative**: The second derivative is constant:
   $$\\frac{d^2}{dx^2}(x^2) = 2$$
   This indicates a uniform rate of change of slope, giving the parabola its smooth, characteristic curvature.`;
    }

    if (q.includes('coefficient') || q.includes('what happens if i increase')) {
      return `### Effect of Changing Equation Coefficients

In general functions $y = a \\cdot f(b(x - c)) + d$:

- **$a$ (Vertical Scaling / Dilation)**:
  - If $|a| > 1$, the graph stretches vertically away from the x-axis (steeper).
  - If $0 < |a| < 1$, the graph is compressed vertically.
  - If $a < 0$, the graph reflects across the $x$-axis.
- **$b$ (Horizontal Scaling)**:
  - If $|b| > 1$, the curve is compressed horizontally by a factor of $1/|b|$.
  - Frequency increases in periodic functions like $\\sin(bx)$.
- **$c$ (Horizontal Shift)**:
  - Shifts the curve right if $c > 0$, or left if $c < 0$.
- **$d$ (Vertical Shift)**:
  - Shifts the entire graph upwards ($d > 0$) or downwards ($d < 0$).`;
    }

    if (q.includes('practice') || q.includes('quiz') || q.includes('question')) {
      return `### Practice Challenge: Quadratic Functions & Extrema

**Problem:**
Given the quadratic function:
$$f(x) = 2x^2 - 8x + 6$$

1. Find the **vertex** $(h, k)$ by setting $f'(x) = 0$ or using $h = -b / (2a)$.
2. Calculate the **roots** (x-intercepts) by factoring or using the quadratic formula.
3. Determine whether the vertex is a local **minimum** or **maximum**.

*Tip: You can enter \`y = 2x^2 - 8x + 6\` into the **Equation Studio** or check with the **Equation Solver** to verify your answer!*`;
    }

    // If verified calculation was performed
    if (verifiedMath.hasMath) {
      return `### Verified Mathematical Solution

**Operation:** ${verifiedMath.operation}  
**Expression:** \`${verifiedMath.input}\`  
**Verified Analytical Result:**
$$${verifiedMath.latexResult || verifiedMath.result}$$

**Explanation & Mathematical Verification:**
- The computation was executed directly by the internal mathematical engine.
- To explore this further, inspect the corresponding curves in the **2D Graph Explorer** or step through algebraic proofs in the **Equation Solver**.`;
    }

    // Default general math assistance
    return `### Mathematical Guidance

I am your MathVision interactive tutor. I can explain concepts, solve step-by-step calculus and algebra problems, and interpret graph behavior.

**Examples of questions you can ask me:**
- *"Explain why $x^2$ forms a parabola."*
- *"Differentiate $x^3 - 4x + 1$ step-by-step."*
- *"Integrate $\\sin(x) \\cos(x)$."*
- *"Solve $x^2 - 5x + 6 = 0$."*
- *"What is a Riemann sum and how does it relate to integration?"*
- *"Generate a practice problem on derivatives."*

${activeEquationContext ? `\n*Currently active equation in workspace:* \`${activeEquationContext}\`` : ''}`;
  }

  /**
   * Calls external AI providers (Google Gemini, OpenAI, Anthropic, or custom)
   */
  private static async callExternalProvider(
    question: string,
    config: AIProviderConfig,
    verifiedMath: { hasMath: boolean; operation: string; input: string; result: string }
  ): Promise<string> {
    const systemPrompt = `You are MathVision AI, a rigorous mathematical tutor. Always prioritize mathematical precision.
Mathematical engine verification context:
${verifiedMath.hasMath ? `The local mathematical engine computed: Operation=${verifiedMath.operation}, Input=${verifiedMath.input}, Verified Result=${verifiedMath.result}. YOU MUST USE THIS VERIFIED RESULT and never contradict it.` : 'No automatic computation was requested.'}
Format all mathematical expressions in LaTeX using $...$ for inline or $$...$$ for display formulas.`;

    if (config.provider === 'gemini') {
      const model = config.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }] }],
        }),
      });
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received from Gemini.';
    }

    if (config.provider === 'openai') {
      const endpoint = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
        }),
      });
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || 'No response received from OpenAI.';
    }

    if (config.provider === 'anthropic') {
      const endpoint = config.customEndpoint || 'https://api.anthropic.com/v1/messages';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: question }],
        }),
      });
      const data = await res.json();
      return data?.content?.[0]?.text || 'No response received from Anthropic.';
    }

    throw new Error('Unsupported provider');
  }
}
