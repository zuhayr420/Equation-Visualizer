import type { GraphAnalysis } from '../../types';
import { NumericalEngine } from '../numerical/numericalEngine';
import { SymbolicEngine } from '../symbolic/symbolicEngine';

export class GraphAnalyzer {
  /**
   * Analyzes a 2D function y = f(x) over [xMin, xMax]
   */
  static analyzeFunction(
    fn: (x: number) => number,
    expression: string,
    xMin: number = -10,
    xMax: number = 10
  ): GraphAnalysis {
    // 1. Roots / X-intercepts
    const roots = NumericalEngine.findRoots(fn, xMin, xMax);

    // 2. Y-intercept: f(0)
    let yIntercept: number | null = null;
    try {
      const y0 = fn(0);
      if (typeof y0 === 'number' && isFinite(y0)) {
        yIntercept = Math.round(y0 * 1000) / 1000;
      }
    } catch {
      yIntercept = null;
    }

    // 3. Local Extrema & Turning Points
    const extrema = NumericalEngine.findExtrema(fn, xMin, xMax);

    // 4. Asymptotes detection
    const asymptotes: { type: 'vertical' | 'horizontal'; value: number }[] = [];
    const step = 0.05;
    for (let x = xMin; x <= xMax; x += step) {
      const yLeft = fn(x - 0.001);
      const yRight = fn(x + 0.001);
      if (
        (Math.abs(yLeft) > 50 && Math.abs(yRight) > 50 && Math.sign(yLeft) !== Math.sign(yRight)) ||
        (!isFinite(fn(x)) && (isFinite(yLeft) || isFinite(yRight)))
      ) {
        const roundedX = Math.round(x * 10) / 10;
        if (!asymptotes.some((a) => a.type === 'vertical' && Math.abs(a.value - roundedX) < 0.2)) {
          asymptotes.push({ type: 'vertical', value: roundedX });
        }
      }
    }

    // Horizontal asymptote check as x -> ±inf
    try {
      const yInfPos = fn(10000);
      const yInfNeg = fn(-10000);
      if (isFinite(yInfPos) && Math.abs(fn(10001) - yInfPos) < 1e-4) {
        asymptotes.push({ type: 'horizontal', value: Math.round(yInfPos * 100) / 100 });
      } else if (isFinite(yInfNeg) && Math.abs(fn(-10001) - yInfNeg) < 1e-4) {
        asymptotes.push({ type: 'horizontal', value: Math.round(yInfNeg * 100) / 100 });
      }
    } catch {
      // Ignored
    }

    // 5. Intervals of increase/decrease
    const intervals: { type: 'increasing' | 'decreasing'; from: number; to: number }[] = [];
    const criticalPoints = [xMin, ...extrema.map((e) => e.x), xMax].sort((a, b) => a - b);

    for (let i = 0; i < criticalPoints.length - 1; i++) {
      const from = criticalPoints[i];
      const to = criticalPoints[i + 1];
      if (to - from < 0.1) continue;

      const mid = (from + to) / 2;
      const slope = NumericalEngine.numericalDerivative(fn, mid);

      if (isFinite(slope)) {
        intervals.push({
          type: slope > 0 ? 'increasing' : 'decreasing',
          from: Math.round(from * 10) / 10,
          to: Math.round(to * 10) / 10,
        });
      }
    }

    // 6. Range bounds estimated from samples
    const sample = NumericalEngine.sample2DCurve(fn, xMin, xMax, 300);
    const validYs = sample.y.filter((y): y is number => y !== null && isFinite(y));
    let range = '(-\\infty, \\infty)';
    if (validYs.length > 0) {
      const minY = Math.min(...validYs);
      const maxY = Math.max(...validYs);
      const isCappedMin = minY > -50;
      const isCappedMax = maxY < 50;
      if (isCappedMin && isCappedMax) {
        range = `[${minY.toFixed(2)}, ${maxY.toFixed(2)}]`;
      } else if (isCappedMin) {
        range = `[${minY.toFixed(2)}, \\infty)`;
      } else if (isCappedMax) {
        range = `(-\\infty, ${maxY.toFixed(2)}]`;
      }
    }

    // 7. Symbolic derivative and integral representations
    let derivativeLatex = '';
    let integralLatex = '';
    try {
      const diffRes = SymbolicEngine.differentiate(expression, 'x');
      derivativeLatex = diffRes.finalAnswerLatex;
    } catch {
      derivativeLatex = "f'(x)";
    }

    try {
      const intRes = SymbolicEngine.integrate(expression, 'x');
      integralLatex = intRes.finalAnswerLatex;
    } catch {
      integralLatex = '\\int f(x) dx';
    }

    return {
      roots,
      yIntercept,
      extrema,
      domain: 'x \\in \\mathbb{R}',
      range,
      asymptotes,
      intervals,
      derivativeLatex,
      integralLatex,
    };
  }
}
