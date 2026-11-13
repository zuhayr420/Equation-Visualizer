import React from 'react';
import { EquationSolver } from '../components/solver/EquationSolver';

export const SolverPage: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-3.5">
        <h2 className="text-lg font-bold text-text-main">Symbolic & Numerical Equation Solver</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Step-by-step transformations, factorization, calculus derivations, matrix operations, and verified proofs.
        </p>
      </div>
      <EquationSolver />
    </div>
  );
};
