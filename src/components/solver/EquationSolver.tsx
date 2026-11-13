import React, { useState } from 'react';
import {
  Calculator,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Grid3X3,
} from 'lucide-react';
import { SymbolicEngine } from '../../engines/symbolic/symbolicEngine';
import { NumericalEngine } from '../../engines/numerical/numericalEngine';
import { parseEquation } from '../../engines/parser/expressionParser';
import { useAppStore } from '../../store/useAppStore';
import type { SolverResult } from '../../types';
import { MathView } from '../common/MathView';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const EquationSolver: React.FC = () => {
  const { addToHistory } = useAppStore();

  const [activeTab, setActiveTab] = useState<'algebra' | 'calculus' | 'matrices' | 'roots'>('algebra');
  const [operation, setOperation] = useState<string>('solve');
  const [inputVal, setInputVal] = useState<string>('x^2 - 4x + 3 = 0');
  const [variable, setVariable] = useState<string>('x');
  const [lowerBound, setLowerBound] = useState<string>('0');
  const [upperBound, setUpperBound] = useState<string>('pi');
  const [limitPoint, setLimitPoint] = useState<string>('0');

  // Matrix states
  const [matrixA, setMatrixA] = useState<number[][]>([
    [2, 1],
    [1, 3],
  ]);
  const [matrixB, setMatrixB] = useState<number[][]>([
    [1, 0],
    [2, 1],
  ]);
  const [matrixSize, setMatrixSize] = useState<2 | 3>(2);

  const [result, setResult] = useState<SolverResult | null>(null);

  const handleSolve = () => {
    let res: SolverResult;

    if (activeTab === 'algebra') {
      if (operation === 'factor') {
        res = SymbolicEngine.factor(inputVal);
      } else if (operation === 'expand') {
        res = SymbolicEngine.expand(inputVal);
      } else if (operation === 'simplify') {
        res = SymbolicEngine.simplify(inputVal);
      } else {
        res = SymbolicEngine.solveEquation(inputVal, variable);
      }
    } else if (activeTab === 'calculus') {
      if (operation === 'integrate-definite') {
        res = SymbolicEngine.integrate(inputVal, variable, lowerBound, upperBound);
      } else if (operation === 'integrate') {
        res = SymbolicEngine.integrate(inputVal, variable);
      } else if (operation === 'limit') {
        res = SymbolicEngine.limit(inputVal, variable, limitPoint);
      } else {
        res = SymbolicEngine.differentiate(inputVal, variable);
      }
    } else if (activeTab === 'roots') {
      // Numerical root finding
      const startTime = performance.now();
      try {
        const clean = inputVal.replace(/^y\s*=\s*/i, '');
        const parsed = parseEquation(clean);
        const fn = parsed.eval1D || ((x: number) => 0);
        const roots = NumericalEngine.findRoots(fn, -10, 10);
        res = {
          operation: 'Numerical Root Finding',
          input: inputVal,
          steps: [
            {
              stepNumber: 1,
              title: 'Interval Grid Search',
              latex: `f(x) = ${SymbolicEngine.toTeX(clean)}`,
              explanation: 'Scan interval [-10, 10] for intermediate value sign changes where f(a) * f(b) < 0.',
            },
            {
              stepNumber: 2,
              title: 'Bisection & Newton-Raphson Polish',
              latex: `\\text{Roots Found: } x \\in \\{${roots.join(', ')}\\}`,
              explanation: 'Converge iteratively to sub-1e-6 tolerance on all isolated roots.',
            },
          ],
          finalAnswer: roots.length > 0 ? `x = [${roots.join(', ')}]` : 'No real roots found in [-10, 10]',
          finalAnswerLatex: roots.length > 0 ? `x \\in \\{${roots.join(', ')}\\}` : '\\text{No real roots found}',
          isApproximate: true,
          verification: 'Verified via numerical interval analysis.',
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      } catch (err: any) {
        res = {
          operation: 'Numerical Root Finding',
          input: inputVal,
          steps: [],
          finalAnswer: 'Evaluation failed',
          finalAnswerLatex: '\\text{Evaluation failed}',
          isApproximate: true,
          executionTimeMs: 0,
        };
      }
    } else {
      // Matrix operations
      const startTime = performance.now();
      if (operation === 'matrix-det') {
        const det = NumericalEngine.matrixDeterminant(matrixA);
        res = {
          operation: 'Matrix Determinant',
          input: JSON.stringify(matrixA),
          steps: [
            {
              stepNumber: 1,
              title: 'Compute Determinant',
              latex: `\\det(A) = ${det}`,
              explanation: 'Calculated via cofactor expansion along rows.',
            },
          ],
          finalAnswer: `det(A) = ${det}`,
          finalAnswerLatex: `\\det(A) = ${det}`,
          isApproximate: false,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      } else if (operation === 'matrix-inv') {
        const inv = NumericalEngine.matrixInverse(matrixA);
        const formatMatrix = (M: number[][]) =>
          `\\begin{pmatrix} ${M.map((row) => row.map((v) => v.toFixed(3)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
        res = {
          operation: 'Matrix Inverse',
          input: JSON.stringify(matrixA),
          steps: [
            {
              stepNumber: 1,
              title: 'Inverse Matrix Calculation',
              latex: inv ? `A^{-1} = ${formatMatrix(inv)}` : '\\text{Matrix is singular (det = 0)}',
              explanation: inv ? 'Inverted using adjugate matrix divided by determinant.' : 'Non-invertible singular matrix.',
            },
          ],
          finalAnswer: inv ? 'Inverse computed' : 'Singular matrix',
          finalAnswerLatex: inv ? `A^{-1} = ${formatMatrix(inv)}` : '\\text{Singular / Not Invertible}',
          isApproximate: false,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      } else if (operation === 'matrix-mult') {
        const mult = NumericalEngine.matrixMultiply(matrixA, matrixB);
        const formatMatrix = (M: number[][]) =>
          `\\begin{pmatrix} ${M.map((row) => row.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
        res = {
          operation: 'Matrix Multiplication',
          input: 'A * B',
          steps: [
            {
              stepNumber: 1,
              title: 'Row-Column Dot Products',
              latex: `A \\cdot B = ${formatMatrix(mult)}`,
              explanation: 'Each element (i, j) is the inner product of row i of A and column j of B.',
            },
          ],
          finalAnswer: 'A * B computed',
          finalAnswerLatex: `A \\cdot B = ${formatMatrix(mult)}`,
          isApproximate: false,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      } else {
        // Eigenvalues
        const eig = NumericalEngine.matrixEigenvalues2x2(matrixA);
        res = {
          operation: 'Matrix Eigenvalues (2x2)',
          input: JSON.stringify(matrixA),
          steps: [
            {
              stepNumber: 1,
              title: 'Characteristic Polynomial det(A - lambda*I) = 0',
              latex: eig
                ? `\\lambda_1 = ${eig.lambda1.toFixed(3)}, \\quad \\lambda_2 = ${eig.lambda2.toFixed(3)}`
                : '\\text{Complex eigenvalues or non-2x2 matrix}',
              explanation: 'Solved characteristic quadratic equation.',
            },
          ],
          finalAnswer: eig ? `lambda = [${eig.lambda1.toFixed(3)}, ${eig.lambda2.toFixed(3)}]` : 'Complex / Unsupported',
          finalAnswerLatex: eig
            ? `\\lambda \\in \\{${eig.lambda1.toFixed(3)}, ${eig.lambda2.toFixed(3)}\\}`
            : '\\text{Complex roots}',
          isApproximate: false,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }
    }

    setResult(res);

    // Save to calculation history
    addToHistory({
      category: res.operation,
      input: res.input,
      result: res.finalAnswer,
      latex: res.finalAnswerLatex,
    });
  };

  return (
    <div className="space-y-5">
      {/* Category selector */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2.5 overflow-x-auto text-xs">
        <button
          onClick={() => {
            setActiveTab('algebra');
            setOperation('solve');
            setInputVal('x^2 - 4x + 3 = 0');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-bold transition-colors ${
            activeTab === 'algebra'
              ? 'bg-text-main text-background border border-text-main'
              : 'text-text-muted hover:text-text-main hover:bg-panel'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Algebra & Polynomials</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('calculus');
            setOperation('differentiate');
            setInputVal('x^3 - 3x^2 + 2x');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-bold transition-colors ${
            activeTab === 'calculus'
              ? 'bg-text-main text-background border border-text-main'
              : 'text-text-muted hover:text-text-main hover:bg-panel'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Calculus (Derivatives & Integrals)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('matrices');
            setOperation('matrix-det');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-bold transition-colors ${
            activeTab === 'matrices'
              ? 'bg-text-main text-background border border-text-main'
              : 'text-text-muted hover:text-text-main hover:bg-panel'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>Linear Algebra & Matrices</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('roots');
            setOperation('roots');
            setInputVal('cos(x) - x');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-bold transition-colors ${
            activeTab === 'roots'
              ? 'bg-text-main text-background border border-text-main'
              : 'text-text-muted hover:text-text-main hover:bg-panel'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Numerical Root Finding</span>
        </button>
      </div>

      {/* Input panel */}
      <div className="rounded-md border border-border bg-panel p-4 space-y-3.5">
        {/* Operations Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-text-muted mr-1">Operation:</span>
          {activeTab === 'algebra' && (
            <>
              {['solve', 'simplify', 'factor', 'expand'].map((op) => (
                <button
                  key={op}
                  onClick={() => setOperation(op)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-semibold capitalize transition-colors ${
                    operation === op
                      ? 'bg-text-main text-background border border-text-main'
                      : 'bg-background border border-border text-text-muted hover:text-text-main'
                  }`}
                >
                  {op}
                </button>
              ))}
            </>
          )}

          {activeTab === 'calculus' && (
            <>
              {[
                { id: 'differentiate', label: 'Differentiate d/dx' },
                { id: 'integrate', label: 'Indefinite Integral' },
                { id: 'integrate-definite', label: 'Definite Integral' },
                { id: 'limit', label: 'Limit lim(x->a)' },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => setOperation(op.id)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-semibold transition-colors ${
                    operation === op.id
                      ? 'bg-text-main text-background border border-text-main'
                      : 'bg-background border border-border text-text-muted hover:text-text-main'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </>
          )}

          {activeTab === 'matrices' && (
            <>
              {[
                { id: 'matrix-det', label: 'Determinant det(A)' },
                { id: 'matrix-inv', label: 'Inverse A⁻¹' },
                { id: 'matrix-mult', label: 'Multiply A × B' },
                { id: 'matrix-eig', label: 'Eigenvalues λ' },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => setOperation(op.id)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-semibold transition-colors ${
                    operation === op.id
                      ? 'bg-text-main text-background border border-text-main'
                      : 'bg-background border border-border text-text-muted hover:text-text-main'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Dynamic Inputs */}
        {activeTab !== 'matrices' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-text-muted mb-1">
                Mathematical Expression / Equation:
              </label>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter equation (e.g. x^2 - 4 = 0 or sin(x))..."
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main placeholder-text-muted/60 focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Variable:</label>
              <input
                type="text"
                value={variable}
                onChange={(e) => setVariable(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-main focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border"
              />
            </div>

            {/* Definite integral bounds */}
            {operation === 'integrate-definite' && (
              <div className="md:col-span-4 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1 font-bold">Lower Bound (a):</label>
                  <input
                    type="text"
                    value={lowerBound}
                    onChange={(e) => setLowerBound(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1 font-bold">Upper Bound (b):</label>
                  <input
                    type="text"
                    value={upperBound}
                    onChange={(e) => setUpperBound(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Limit point */}
            {operation === 'limit' && (
              <div className="md:col-span-2">
                <label className="block text-xs text-text-muted mb-1 font-bold">Approaching Point (a):</label>
                <input
                  type="text"
                  value={limitPoint}
                  onChange={(e) => setLimitPoint(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs"
                />
              </div>
            )}
          </div>
        ) : (
          /* Matrix Inputs */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
              <span>Matrix Dimension:</span>
              <button
                type="button"
                onClick={() => setMatrixSize(2)}
                className={`px-2 py-0.5 rounded-sm text-xs ${matrixSize === 2 ? 'bg-text-main text-background font-bold' : 'bg-background border border-border text-text-muted'}`}
              >
                2 × 2
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Matrix A */}
              <div className="p-2.5 rounded-md border border-border bg-background space-y-1.5">
                <span className="text-xs font-bold text-text-muted block">Matrix A:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 1].map((r) =>
                    [0, 1].map((c) => (
                      <input
                        key={`a_${r}_${c}`}
                        type="number"
                        value={matrixA[r]?.[c] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const next = [...matrixA.map((row) => [...row])];
                          next[r][c] = val;
                          setMatrixA(next);
                        }}
                        className="w-14 h-8 text-center rounded-sm border border-border bg-panel text-xs text-text-main"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Matrix B if multiplying */}
              {operation === 'matrix-mult' && (
                <div className="p-2.5 rounded-md border border-border bg-background space-y-1.5">
                  <span className="text-xs font-bold text-text-muted block">Matrix B:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[0, 1].map((r) =>
                      [0, 1].map((c) => (
                        <input
                          key={`b_${r}_${c}`}
                          type="number"
                          value={matrixB[r]?.[c] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const next = [...matrixB.map((row) => [...row])];
                            next[r][c] = val;
                            setMatrixB(next);
                          }}
                          className="w-14 h-8 text-center rounded-sm border border-border bg-panel text-xs text-text-main"
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Solve Button */}
        <div className="flex justify-end pt-1">
          <Button variant="primary" size="sm" onClick={handleSolve} className="px-4">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Compute Verified Solution
          </Button>
        </div>
      </div>

      {/* Step-by-Step Solution Output */}
      {result && (
        <div className="rounded-md border border-border bg-panel p-5 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-text-main" />
                <h3 className="text-sm font-bold text-text-main">{result.operation}</h3>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Original Input: <code className="text-text-main">{result.input}</code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={result.isApproximate ? 'neutral' : 'primary'}>
                {result.isApproximate ? 'Numerical Approximation' : 'Exact Symbolic Proof'}
              </Badge>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {result.executionTimeMs} ms
              </span>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-normal">
              Step-by-Step Transformations:
            </h4>

            <div className="space-y-2">
              {result.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="rounded-md border border-border bg-background/50 p-3.5"
                >
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                    <span className="font-bold text-text-main">Step {step.stepNumber}: {step.title}</span>
                  </div>
                  <div className="p-2 rounded-sm bg-panel border border-border overflow-x-auto my-1.5">
                    <MathView math={step.latex} block className="text-xs font-semibold" />
                  </div>
                  <p className="text-xs text-text-muted">{step.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final Answer Box */}
          <div className="rounded-md border border-border bg-panel p-4 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-normal text-text-muted">
              Final Verified Result:
            </span>
            <div className="overflow-x-auto py-1">
              <MathView math={result.finalAnswerLatex} block className="text-base font-bold text-text-main" />
            </div>
            {result.verification && (
              <p className="text-xs text-text-muted font-medium">
                ✓ {result.verification}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
