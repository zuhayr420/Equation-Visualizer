import * as math from 'mathjs';
import type { Equation, EquationType } from '../../types';

// Blacklist of forbidden tokens to prevent code injection / eval exploits
const FORBIDDEN_TOKENS = [
  'constructor', 'prototype', '__proto__', 'import', 'require',
  'window', 'document', 'global', 'process', 'eval', 'Function',
  'fetch', 'XMLHttpRequest', 'alert', 'console', 'setTimeout', 'setInterval'
];

export interface ParsedEquation {
  type: EquationType;
  lhs: string;
  rhs: string;
  cleanExpression: string; // Ready for evaluation
  dependentVar: string;
  independentVars: string[];
  latex: string;
  compiledFn?: (scope: Record<string, number>) => number;
  eval1D?: (x: number) => number;
  implicitFn?: (x: number, y: number) => number;
  isValid: boolean;
  error?: string;
}

/**
 * Inserts missing multiplication signs:
 * 2x -> 2*x
 * 3sin(x) -> 3*sin(x)
 * (x+1)(x-2) -> (x+1)*(x-2)
 * x(x+1) -> x*(x+1)
 * 4pi -> 4*pi
 */
export function preprocessExpression(expr: string): string {
  let s = expr.trim();
  
  // Replace unicode characters
  s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  s = s.replace(/\bdeg\b/g, '* (pi / 180)');
  s = s.replace(/\bln\((.*?)\)/g, 'log($1)');
  s = s.replace(/\bln\s+([a-zA-Z0-9]+)/g, 'log($1)');

  // Convert scientific notation or basic patterns like e^x -> exp(x)
  s = s.replace(/\be\^([a-zA-Z0-9_]+)/g, 'exp($1)');
  s = s.replace(/\be\^\((.*?)\)/g, 'exp($1)');

  // Implicit multiplication: number followed by variable or parenthesis
  // e.g. 2x -> 2*x, 2(x) -> 2*(x), 2sin(x) -> 2*sin(x)
  s = s.replace(/(\d+)\s*([a-zA-Z(])/g, '$1*$2');
  
  // Implicit multiplication: closing parenthesis followed by variable or open parenthesis
  // e.g. (x+1)(x-1) -> (x+1)*(x-1), (x+1)x -> (x+1)*x
  s = s.replace(/\)\s*([a-zA-Z0-9_(])/g, ')*$1');

  // Variable followed by function: e.g. x sin(x) -> x*sin(x)
  s = s.replace(/\b([xyzt])\s*([a-zA-Z]+\()/g, '$1*$2');

  return s;
}

export function validateSafeMath(expr: string): { safe: boolean; error?: string } {
  for (const token of FORBIDDEN_TOKENS) {
    if (new RegExp(`\\b${token}\\b`, 'i').test(expr)) {
      return { safe: false, error: `Invalid or unsafe token: "${token}"` };
    }
  }
  return { safe: true };
}

export function detectEquationType(raw: string): {
  type: EquationType;
  lhs: string;
  rhs: string;
  isInequality: boolean;
  inequalityOp?: '<' | '<=' | '>' | '>=';
} {
  const trimmed = raw.trim();

  // Check inequality
  const ineqMatch = trimmed.match(/^([^<>]+)(<=|>=|<|>)([^<>]+)$/);
  if (ineqMatch) {
    return {
      type: 'inequality',
      lhs: ineqMatch[1].trim(),
      rhs: ineqMatch[3].trim(),
      isInequality: true,
      inequalityOp: ineqMatch[2] as any,
    };
  }

  // Check parametric: e.g., x=cos(t), y=sin(t)
  if (trimmed.includes(';') || (trimmed.startsWith('x=') && trimmed.includes('y='))) {
    return {
      type: '2d-parametric',
      lhs: 'parametric',
      rhs: trimmed,
      isInequality: false,
    };
  }

  // Check polar: r = ...
  if (/^r(\(theta\))?\s*=/i.test(trimmed)) {
    const parts = trimmed.split('=');
    return {
      type: '2d-polar',
      lhs: 'r',
      rhs: parts.slice(1).join('=').trim(),
      isInequality: false,
    };
  }

  // Check 3D: z = ... or f(x,y) = ...
  if (/^z\s*=/i.test(trimmed) || /^f\s*\(\s*x\s*,\s*y\s*\)\s*=/i.test(trimmed)) {
    const parts = trimmed.split('=');
    return {
      type: '3d-surface',
      lhs: 'z',
      rhs: parts.slice(1).join('=').trim(),
      isInequality: false,
    };
  }

  // Check standard equality
  if (trimmed.includes('=')) {
    const parts = trimmed.split('=');
    const lhs = parts[0].trim();
    const rhs = parts.slice(1).join('=').trim();

    // Check if simple explicit y = f(x) or f(x) = ...
    if (lhs.toLowerCase() === 'y' || /^f\s*\(\s*x\s*\)$/i.test(lhs)) {
      return {
        type: '2d-explicit',
        lhs: 'y',
        rhs: rhs,
        isInequality: false,
      };
    }

    // Check implicit like x^2 + y^2 = 25
    return {
      type: '2d-implicit',
      lhs: lhs,
      rhs: rhs,
      isInequality: false,
    };
  }

  // No '=': default to explicit y = expr
  return {
    type: '2d-explicit',
    lhs: 'y',
    rhs: trimmed,
    isInequality: false,
  };
}

export function parseEquation(raw: string): ParsedEquation {
  const safety = validateSafeMath(raw);
  if (!safety.safe) {
    return {
      type: '2d-explicit',
      lhs: '',
      rhs: '',
      cleanExpression: '',
      dependentVar: 'y',
      independentVars: ['x'],
      latex: '',
      isValid: false,
      error: safety.error,
    };
  }

  try {
    const { type, lhs, rhs } = detectEquationType(raw);
    const cleanLhs = preprocessExpression(lhs);
    const cleanRhs = preprocessExpression(rhs);

    let cleanExpression = cleanRhs;
    let dependentVar = 'y';
    let independentVars = ['x'];

    if (type === '2d-polar') {
      dependentVar = 'r';
      independentVars = ['theta', 't'];
    } else if (type === '3d-surface') {
      dependentVar = 'z';
      independentVars = ['x', 'y'];
    } else if (type === '2d-implicit') {
      // Form LHS - RHS = 0
      cleanExpression = `(${cleanLhs}) - (${cleanRhs})`;
      dependentVar = 'implicit';
      independentVars = ['x', 'y'];
    }

    // Try parsing with Math.js
    let parsedNode: math.MathNode;
    try {
      parsedNode = math.parse(cleanExpression);
    } catch (parseErr: any) {
      return {
        type,
        lhs: cleanLhs,
        rhs: cleanRhs,
        cleanExpression,
        dependentVar,
        independentVars,
        latex: '',
        isValid: false,
        error: `Syntax error: ${parseErr.message || 'Invalid mathematical expression'}`,
      };
    }

    // Compile into an evaluation function
    const compiled = parsedNode.compile();

    const compiledFn = (scope: Record<string, number>): number => {
      try {
        const val = compiled.evaluate(scope);
        if (typeof val === 'number') {
          return isFinite(val) ? val : NaN;
        }
        if (val && typeof val === 'object' && 're' in val) {
          // Complex number: return real part if imaginary part is negligible
          return Math.abs(val.im) < 1e-9 ? val.re : NaN;
        }
        return NaN;
      } catch {
        return NaN;
      }
    };

    const eval1D = (x: number): number => compiledFn({ x, t: 0, theta: x });

    let latex = '';
    try {
      latex = parsedNode.toTex({ parenthesis: 'auto' });
      if (type === '2d-explicit') {
        latex = `y = ${latex}`;
      } else if (type === '2d-polar') {
        latex = `r = ${latex}`;
      } else if (type === '3d-surface') {
        latex = `z = ${latex}`;
      } else if (type === '2d-implicit') {
        latex = `${cleanLhs} = ${cleanRhs}`;
      }
    } catch {
      latex = raw;
    }

    let implicitFn: ((x: number, y: number) => number) | undefined;
    if (type === '2d-implicit') {
      implicitFn = (x: number, y: number) => compiledFn({ x, y });
    }

    return {
      type,
      lhs: cleanLhs,
      rhs: cleanRhs,
      cleanExpression,
      dependentVar,
      independentVars,
      latex,
      compiledFn,
      eval1D,
      implicitFn,
      isValid: true,
    };
  } catch (err: any) {
    return {
      type: '2d-explicit',
      lhs: '',
      rhs: '',
      cleanExpression: '',
      dependentVar: 'y',
      independentVars: ['x'],
      latex: '',
      isValid: false,
      error: err?.message || 'Could not parse mathematical equation',
    };
  }
}

/**
 * Creates a default equation helper
 */
export function createDefaultEquation(
  rawInput: string,
  color: string = '#7C8FFF',
  label: string = 'f(x)'
): Equation {
  const parsed = parseEquation(rawInput);
  return {
    id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    rawInput,
    expression: parsed.cleanExpression,
    latex: parsed.latex,
    type: parsed.type,
    color,
    visible: true,
    label,
    valid: parsed.isValid,
    errorMessage: parsed.error,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
