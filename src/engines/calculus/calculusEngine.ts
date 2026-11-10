import { NumericalEngine } from '../numerical/numericalEngine';
import { SymbolicEngine } from '../symbolic/symbolicEngine';
import { parseEquation } from '../parser/expressionParser';

export interface TangentLineData {
  x0: number;
  y0: number;
  slope: number;
  lineX: number[];
  lineY: number[];
  equationLatex: string;
}

export interface SecantLineData {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  deltaX: number;
  slope: number;
  lineX: number[];
  lineY: number[];
}

export interface LimitApproximation {
  x: number;
  fx: number;
  delta: number;
}

export interface LimitAnalysis {
  leftLimit: number | null;
  rightLimit: number | null;
  limit: number | null;
  exists: boolean;
  leftTable: LimitApproximation[];
  rightTable: LimitApproximation[];
  message: string;
}

export interface TaylorTerm {
  order: number;
  derivativeValue: number;
  coefficient: number;
  termLatex: string;
}

export interface TaylorSeriesResult {
  order: number;
  center: number;
  polynomialLatex: string;
  terms: TaylorTerm[];
  evalFn: (x: number) => number;
}

export class CalculusEngine {
  /**
   * Computes tangent line at x0
   */
  static getTangentLine(
    fn: (x: number) => number,
    x0: number,
    xSpan: number = 4
  ): TangentLineData {
    const y0 = fn(x0);
    const slope = NumericalEngine.numericalDerivative(fn, x0);

    const xStart = x0 - xSpan;
    const xEnd = x0 + xSpan;

    const yStart = y0 + slope * (xStart - x0);
    const yEnd = y0 + slope * (xEnd - x0);

    const roundedSlope = Math.round(slope * 1000) / 1000;
    const roundedY0 = Math.round(y0 * 1000) / 1000;

    const intercept = roundedY0 - roundedSlope * x0;
    const sign = intercept >= 0 ? '+' : '-';
    const absIntercept = Math.abs(Math.round(intercept * 1000) / 1000);
    const equationLatex = `y = ${roundedSlope}x ${sign} ${absIntercept}`;

    return {
      x0,
      y0,
      slope,
      lineX: [xStart, xEnd],
      lineY: [yStart, yEnd],
      equationLatex,
    };
  }

  /**
   * Computes secant line between x0 and x0 + deltaX
   */
  static getSecantLine(
    fn: (x: number) => number,
    x0: number,
    deltaX: number,
    xSpan: number = 4
  ): SecantLineData {
    const x1 = x0 + deltaX;
    const y0 = fn(x0);
    const y1 = fn(x1);
    const slope = (y1 - y0) / deltaX;

    const xStart = x0 - xSpan;
    const xEnd = x1 + xSpan;
    const yStart = y0 + slope * (xStart - x0);
    const yEnd = y0 + slope * (xEnd - x0);

    return {
      x0,
      x1,
      y0,
      y1,
      deltaX,
      slope,
      lineX: [xStart, xEnd],
      lineY: [yStart, yEnd],
    };
  }

  /**
   * Limit table and evaluation as x -> a
   */
  static analyzeLimit(fn: (x: number) => number, a: number): LimitAnalysis {
    const deltas = [0.1, 0.05, 0.01, 0.005, 0.001, 0.0001];

    const leftTable: LimitApproximation[] = deltas.map((d) => {
      const x = a - d;
      const fx = fn(x);
      return { x: Math.round(x * 10000) / 10000, fx: Math.round(fx * 10000) / 10000, delta: -d };
    });

    const rightTable: LimitApproximation[] = deltas.map((d) => {
      const x = a + d;
      const fx = fn(x);
      return { x: Math.round(x * 10000) / 10000, fx: Math.round(fx * 10000) / 10000, delta: d };
    });

    const lastLeft = leftTable[leftTable.length - 1].fx;
    const lastRight = rightTable[rightTable.length - 1].fx;

    const leftLimit = isFinite(lastLeft) ? lastLeft : null;
    const rightLimit = isFinite(lastRight) ? lastRight : null;

    let limit: number | null = null;
    let exists = false;
    let message = '';

    if (leftLimit !== null && rightLimit !== null) {
      if (Math.abs(leftLimit - rightLimit) < 0.01) {
        limit = (leftLimit + rightLimit) / 2;
        exists = true;
        message = `Two-sided limit exists: L = ${limit.toFixed(4)}`;
      } else {
        message = `Left limit (${leftLimit.toFixed(4)}) ≠ Right limit (${rightLimit.toFixed(4)}). Limit does not exist.`;
      }
    } else {
      message = 'Limit approaches ±infinity or is unbounded.';
    }

    return {
      leftLimit,
      rightLimit,
      limit,
      exists,
      leftTable,
      rightTable,
      message,
    };
  }

  /**
   * Taylor series expansion around point `a` up to order `n`
   */
  static getTaylorSeries(
    expression: string,
    a: number = 0,
    maxOrder: number = 4
  ): TaylorSeriesResult {
    const terms: TaylorTerm[] = [];
    const factorial = (k: number): number => (k <= 1 ? 1 : k * factorial(k - 1));

    let currentExpr = expression;
    let polyLatexParts: string[] = [];

    for (let k = 0; k <= maxOrder; k++) {
      let derivVal = 0;
      try {
        if (k === 0) {
          const res = SymbolicEngine.simplify(currentExpr);
          derivVal = Number(res.finalAnswer) || 0;
        } else {
          const diffRes = SymbolicEngine.differentiate(currentExpr, 'x');
          currentExpr = diffRes.finalAnswer;
        }
      } catch {
        // Fallback
      }

      // Evaluate derivative at x = a
      try {
        const parsed = parseEquation(currentExpr);
        const fn = parsed.eval1D || ((x: number) => 0);
        derivVal = isFinite(derivVal) && derivVal !== 0 ? derivVal : NumericalEngine.numericalDerivative(fn, a);
      } catch {
        derivVal = 0;
      }

      const fact = factorial(k);
      const coeff = derivVal / fact;

      if (Math.abs(coeff) > 1e-6) {
        let termLatex = '';
        const roundedCoeff = Math.round(coeff * 100) / 100;

        if (k === 0) {
          termLatex = `${roundedCoeff}`;
        } else if (k === 1) {
          termLatex = a === 0 ? `${roundedCoeff}x` : `${roundedCoeff}(x - ${a})`;
        } else {
          termLatex = a === 0 ? `${roundedCoeff}x^{${k}}` : `${roundedCoeff}(x - ${a})^{${k}}`;
        }

        polyLatexParts.push(termLatex);
        terms.push({
          order: k,
          derivativeValue: derivVal,
          coefficient: coeff,
          termLatex,
        });
      }
    }

    const polynomialLatex = polyLatexParts.length > 0 ? polyLatexParts.join(' + ').replace(/\+\s*-/g, '- ') : '0';

    const evalFn = (x: number) => {
      let sum = 0;
      for (const t of terms) {
        sum += t.coefficient * Math.pow(x - a, t.order);
      }
      return sum;
    };

    return {
      order: maxOrder,
      center: a,
      polynomialLatex: `P_{${maxOrder}}(x) = ${polynomialLatex}`,
      terms,
      evalFn,
    };
  }
}
