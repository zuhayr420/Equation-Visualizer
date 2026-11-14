import { describe, it, expect } from 'vitest';
import { parseEquation, preprocessExpression, validateSafeMath } from '../src/engines/parser/expressionParser';
import { SymbolicEngine } from '../src/engines/symbolic/symbolicEngine';
import { NumericalEngine } from '../src/engines/numerical/numericalEngine';
import { CalculusEngine } from '../src/engines/calculus/calculusEngine';

describe('MathVision Mathematical Engine Tests', () => {
  describe('Expression Parser & Preprocessor', () => {
    it('handles implicit multiplication (2x -> 2*x, 3sin(x) -> 3*sin(x))', () => {
      expect(preprocessExpression('2x + 5')).toBe('2*x + 5');
      expect(preprocessExpression('3sin(x)')).toBe('3*sin(x)');
      expect(preprocessExpression('(x+1)(x-2)')).toBe('(x+1)*(x-2)');
    });

    it('rejects forbidden tokens and code injection', () => {
      expect(validateSafeMath('constructor.constructor("alert(1)")()').safe).toBe(false);
      expect(validateSafeMath('import "fs"').safe).toBe(false);
      expect(validateSafeMath('window.location').safe).toBe(false);
      expect(validateSafeMath('x^2 - 4x + 3').safe).toBe(true);
    });

    it('parses explicit 2D functions', () => {
      const parsed = parseEquation('y = 2x + 5');
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe('2d-explicit');
      expect(parsed.eval1D?.(2)).toBe(9);
      expect(parsed.eval1D?.(0)).toBe(5);
    });

    it('parses quadratic functions', () => {
      const parsed = parseEquation('y = x^2 - 4x + 3');
      expect(parsed.isValid).toBe(true);
      expect(parsed.eval1D?.(0)).toBe(3);
      expect(parsed.eval1D?.(1)).toBe(0);
      expect(parsed.eval1D?.(3)).toBe(0);
    });

    it('parses trigonometric functions', () => {
      const parsed = parseEquation('y = sin(x)');
      expect(parsed.isValid).toBe(true);
      expect(Math.abs(parsed.eval1D?.(0) ?? 1)).toBeLessThan(1e-6);
      expect(Math.abs((parsed.eval1D?.(Math.PI / 2) ?? 0) - 1)).toBeLessThan(1e-6);
    });

    it('parses exponential and logarithmic functions', () => {
      const expParsed = parseEquation('y = exp(x)');
      expect(expParsed.isValid).toBe(true);
      expect(Math.abs((expParsed.eval1D?.(0) ?? 0) - 1)).toBeLessThan(1e-6);

      const logParsed = parseEquation('y = log(x)');
      expect(logParsed.isValid).toBe(true);
      expect(Math.abs((logParsed.eval1D?.(1) ?? 1) - 0)).toBeLessThan(1e-6);
    });

    it('parses implicit equations (e.g. circle x^2 + y^2 = 25)', () => {
      const parsed = parseEquation('x^2 + y^2 = 25');
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe('2d-implicit');
      expect(parsed.implicitFn?.(3, 4)).toBe(0); // 3^2 + 4^2 - 25 = 0
    });

    it('parses 3D surfaces z = x^2 + y^2', () => {
      const parsed = parseEquation('z = x^2 + y^2');
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe('3d-surface');
      expect(parsed.compiledFn?.({ x: 2, y: 3 })).toBe(13);
    });
  });

  describe('Symbolic Engine', () => {
    it('solves polynomial equations symbolically', () => {
      const res = SymbolicEngine.solveEquation('x^2 - 4 = 0', 'x');
      expect(res.finalAnswer).toContain('2');
      expect(res.steps.length).toBeGreaterThan(0);
    });

    it('differentiates polynomials symbolically', () => {
      const res = SymbolicEngine.differentiate('x^3', 'x');
      expect(res.finalAnswer).toContain('3*x^2');
      expect(res.steps.length).toBeGreaterThan(0);
    });

    it('integrates polynomials symbolically', () => {
      const res = SymbolicEngine.integrate('3*x^2', 'x');
      expect(res.finalAnswer).toContain('x^3');
    });

    it('simplifies algebraic expressions', () => {
      const res = SymbolicEngine.simplify('(x^2 - 1)/(x - 1)');
      expect(res.finalAnswer).toBe('1+x');
    });

    it('factors polynomials', () => {
      const res = SymbolicEngine.factor('x^2 - 4');
      expect(res.finalAnswer).toContain('(-2+x)*(2+x)');
    });

    it('evaluates limits', () => {
      const res = SymbolicEngine.limit('sin(x)/x', 'x', '0');
      expect(res.finalAnswer).toBe('1');
    });
  });

  describe('Numerical Engine & Root Finding', () => {
    it('finds real roots via bisection & Newton method', () => {
      const fn = (x: number) => x * x - 9;
      const roots = NumericalEngine.findRoots(fn, -5, 5);
      expect(roots).toContain(-3);
      expect(roots).toContain(3);
    });

    it('computes numerical derivatives accurately', () => {
      const fn = (x: number) => x * x; // f'(x) = 2x
      const d = NumericalEngine.numericalDerivative(fn, 3);
      expect(Math.abs(d - 6)).toBeLessThan(1e-4);
    });

    it('computes Riemann sum numerical integrals', () => {
      const fn = (x: number) => x; // int_0^2 x dx = 2
      const res = NumericalEngine.calculateRiemann(fn, 0, 2, 50, 'midpoint');
      expect(Math.abs(res.approximateArea - 2)).toBeLessThan(0.01);
    });

    it('handles matrix operations (det, mult, inv)', () => {
      const A = [
        [2, 1],
        [1, 3],
      ];
      const det = NumericalEngine.matrixDeterminant(A);
      expect(det).toBe(5); // 2*3 - 1*1 = 5

      const inv = NumericalEngine.matrixInverse(A);
      expect(inv).not.toBeNull();
      expect(inv![0][0]).toBeCloseTo(3 / 5);
      expect(inv![0][1]).toBeCloseTo(-1 / 5);
    });
  });

  describe('Calculus Engine', () => {
    it('computes tangent line coordinates and slope', () => {
      const fn = (x: number) => x * x;
      const tangent = CalculusEngine.getTangentLine(fn, 2);
      expect(tangent.slope).toBeCloseTo(4, 2);
      expect(tangent.x0).toBe(2);
      expect(tangent.y0).toBe(4);
    });

    it('analyzes limits and detects continuity', () => {
      const fn = (x: number) => (x * x - 1) / (x - 1);
      const limit = CalculusEngine.analyzeLimit(fn, 1);
      expect(limit.exists).toBe(true);
      expect(limit.limit).toBeCloseTo(2, 2);
    });
  });
});
