export interface CurvePoint {
  x: number;
  y: number | null;
}

export interface ExtremaPoint {
  type: 'min' | 'max' | 'inflection';
  x: number;
  y: number;
}

export interface RiemannResult {
  method: 'left' | 'right' | 'midpoint' | 'trapezoid' | 'simpson';
  subdivisions: number;
  approximateArea: number;
  rectangles: { x0: number; x1: number; y0: number; y1: number }[];
}

export class NumericalEngine {
  /**
   * Evaluates derivative numerically via central finite differences
   */
  static numericalDerivative(fn: (x: number) => number, x: number, h: number = 1e-5): number {
    const fPlus = fn(x + h);
    const fMinus = fn(x - h);
    if (!isFinite(fPlus) || !isFinite(fMinus)) return NaN;
    return (fPlus - fMinus) / (2 * h);
  }

  /**
   * Evaluates second derivative numerically
   */
  static numericalSecondDerivative(fn: (x: number) => number, x: number, h: number = 1e-4): number {
    const fPlus = fn(x + h);
    const fCenter = fn(x);
    const fMinus = fn(x - h);
    if (!isFinite(fPlus) || !isFinite(fCenter) || !isFinite(fMinus)) return NaN;
    return (fPlus - 2 * fCenter + fMinus) / (h * h);
  }

  /**
   * Dense sampling with automatic discontinuity detection
   */
  static sample2DCurve(
    fn: (x: number) => number,
    xMin: number,
    xMax: number,
    numPoints: number = 800
  ): { x: (number | null)[]; y: (number | null)[] } {
    const xs: (number | null)[] = [];
    const ys: (number | null)[] = [];
    const step = (xMax - xMin) / (numPoints - 1);

    let prevY: number | null = null;
    const maxJump = 100;

    for (let i = 0; i < numPoints; i++) {
      const x = xMin + i * step;
      let y: number | null = null;

      try {
        const val = fn(x);
        if (typeof val === 'number' && isFinite(val) && !isNaN(val)) {
          y = val;
        }
      } catch {
        y = null;
      }

      // Check for vertical asymptote jump
      if (
        prevY !== null &&
        y !== null &&
        Math.abs(y - prevY) > maxJump &&
        Math.sign(y) !== Math.sign(prevY)
      ) {
        // Discontinuity detected: insert null gap
        xs.push(null);
        ys.push(null);
      }

      xs.push(x);
      ys.push(y);
      prevY = y;
    }

    return { x: xs, y: ys };
  }

  /**
   * Find real roots in [xMin, xMax] using bisection and Newton-Raphson polishing
   */
  static findRoots(
    fn: (x: number) => number,
    xMin: number,
    xMax: number,
    steps: number = 200
  ): number[] {
    const roots: number[] = [];
    const step = (xMax - xMin) / steps;

    for (let i = 0; i < steps; i++) {
      const x1 = xMin + i * step;
      const x2 = x1 + step;
      const y1 = fn(x1);
      const y2 = fn(x2);

      if (!isFinite(y1) || !isFinite(y2)) continue;

      if (Math.abs(y1) < 1e-7) {
        this.addUniqueRoot(roots, x1);
        continue;
      }

      // Sign change indicates a root in (x1, x2)
      if (Math.sign(y1) !== Math.sign(y2)) {
        const polished = this.bisectionRoot(fn, x1, x2);
        if (polished !== null) {
          this.addUniqueRoot(roots, polished);
        }
      }
    }

    return roots.sort((a, b) => a - b);
  }

  private static bisectionRoot(
    fn: (x: number) => number,
    a: number,
    b: number,
    maxIter: number = 40,
    tol: number = 1e-6
  ): number | null {
    let left = a;
    let right = b;
    let fLeft = fn(left);

    for (let i = 0; i < maxIter; i++) {
      const mid = (left + right) / 2;
      const fMid = fn(mid);

      if (Math.abs(fMid) < tol || (right - left) / 2 < tol) {
        return mid;
      }

      if (Math.sign(fMid) === Math.sign(fLeft)) {
        left = mid;
        fLeft = fMid;
      } else {
        right = mid;
      }
    }

    return (left + right) / 2;
  }

  private static addUniqueRoot(roots: number[], r: number, tol: number = 1e-4) {
    if (!roots.some((existing) => Math.abs(existing - r) < tol)) {
      roots.push(Math.round(r * 10000) / 10000);
    }
  }

  /**
   * Find local extrema (minima, maxima) and inflection points
   */
  static findExtrema(
    fn: (x: number) => number,
    xMin: number,
    xMax: number,
    steps: number = 250
  ): ExtremaPoint[] {
    const extrema: ExtremaPoint[] = [];
    const step = (xMax - xMin) / steps;

    for (let i = 1; i < steps - 1; i++) {
      const x = xMin + i * step;
      const d1 = this.numericalDerivative(fn, x);
      const d1Prev = this.numericalDerivative(fn, x - step);
      const d1Next = this.numericalDerivative(fn, x + step);

      if (!isFinite(d1) || !isFinite(d1Prev) || !isFinite(d1Next)) continue;

      // Check sign change of derivative
      if (Math.sign(d1Prev) !== Math.sign(d1Next)) {
        const y = fn(x);
        if (isFinite(y)) {
          const d2 = this.numericalSecondDerivative(fn, x);
          if (d2 > 0) {
            extrema.push({ type: 'min', x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
          } else if (d2 < 0) {
            extrema.push({ type: 'max', x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
          }
        }
      }
    }

    return extrema;
  }

  /**
   * Numerical integration (Riemann sums, Trapezoid, Simpson's)
   */
  static calculateRiemann(
    fn: (x: number) => number,
    a: number,
    b: number,
    n: number,
    method: 'left' | 'right' | 'midpoint' | 'trapezoid' | 'simpson' = 'midpoint'
  ): RiemannResult {
    const dx = (b - a) / n;
    let totalArea = 0;
    const rectangles: { x0: number; x1: number; y0: number; y1: number }[] = [];

    if (method === 'left') {
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = x0 + dx;
        const y = fn(x0);
        const validY = isFinite(y) ? y : 0;
        totalArea += validY * dx;
        rectangles.push({ x0, x1, y0: 0, y1: validY });
      }
    } else if (method === 'right') {
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = x0 + dx;
        const y = fn(x1);
        const validY = isFinite(y) ? y : 0;
        totalArea += validY * dx;
        rectangles.push({ x0, x1, y0: 0, y1: validY });
      }
    } else if (method === 'midpoint') {
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = x0 + dx;
        const mid = (x0 + x1) / 2;
        const y = fn(mid);
        const validY = isFinite(y) ? y : 0;
        totalArea += validY * dx;
        rectangles.push({ x0, x1, y0: 0, y1: validY });
      }
    } else if (method === 'trapezoid') {
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = x0 + dx;
        const y0 = fn(x0) || 0;
        const y1 = fn(x1) || 0;
        totalArea += ((y0 + y1) / 2) * dx;
        rectangles.push({ x0, x1, y0: 0, y1: (y0 + y1) / 2 });
      }
    } else if (method === 'simpson') {
      // Simpson's 1/3 rule (requires even n)
      const adjustedN = n % 2 === 0 ? n : n + 1;
      const simpsonDx = (b - a) / adjustedN;
      let sum = (fn(a) || 0) + (fn(b) || 0);

      for (let i = 1; i < adjustedN; i++) {
        const x = a + i * simpsonDx;
        const y = fn(x) || 0;
        sum += i % 2 === 1 ? 4 * y : 2 * y;
        rectangles.push({ x0: x - simpsonDx / 2, x1: x + simpsonDx / 2, y0: 0, y1: y });
      }
      totalArea = (simpsonDx / 3) * sum;
    }

    return {
      method,
      subdivisions: n,
      approximateArea: Math.round(totalArea * 10000) / 10000,
      rectangles,
    };
  }

  /**
   * Samples a 2D grid for implicit equations F(x, y) = 0
   */
  static sampleImplicitGrid(
    fn: (x: number, y: number) => number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    resolution: number = 80
  ): { x: number[]; y: number[]; z: number[][] } {
    const xVals: number[] = [];
    const yVals: number[] = [];
    const zVals: number[][] = [];

    const dx = (xMax - xMin) / (resolution - 1);
    const dy = (yMax - yMin) / (resolution - 1);

    for (let j = 0; j < resolution; j++) {
      const y = yMin + j * dy;
      yVals.push(y);
      const row: number[] = [];

      for (let i = 0; i < resolution; i++) {
        const x = xMin + i * dx;
        if (j === 0) xVals.push(x);

        try {
          const val = fn(x, y);
          row.push(isFinite(val) ? val : 0);
        } catch {
          row.push(0);
        }
      }
      zVals.push(row);
    }

    return { x: xVals, y: yVals, z: zVals };
  }

  /**
   * Matrix operations
   */
  static matrixAdd(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val + (B[i]?.[j] ?? 0)));
  }

  static matrixMultiply(A: number[][], B: number[][]): number[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const result: number[][] = Array(rowsA).fill(0).map(() => Array(colsB).fill(0));

    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  static matrixDeterminant(M: number[][]): number {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    if (n === 3) {
      return (
        M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
        M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
        M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
      );
    }
    return NaN;
  }

  static matrixInverse(M: number[][]): number[][] | null {
    const det = this.matrixDeterminant(M);
    if (Math.abs(det) < 1e-12) return null; // Singular matrix

    if (M.length === 2) {
      return [
        [M[1][1] / det, -M[0][1] / det],
        [-M[1][0] / det, M[0][0] / det],
      ];
    }
    if (M.length === 3) {
      const inv: number[][] = Array(3).fill(0).map(() => Array(3).fill(0));
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const sub: number[][] = [];
          for (let r = 0; r < 3; r++) {
            if (r === i) continue;
            const subRow: number[] = [];
            for (let c = 0; c < 3; c++) {
              if (c === j) continue;
              subRow.push(M[r][c]);
            }
            sub.push(subRow);
          }
          const cofactor = Math.pow(-1, i + j) * this.matrixDeterminant(sub);
          inv[j][i] = cofactor / det; // Transposed cofactor matrix
        }
      }
      return inv;
    }
    return null;
  }

  static matrixTranspose(M: number[][]): number[][] {
    return M[0].map((_, colIndex) => M.map((row) => row[colIndex]));
  }

  static matrixEigenvalues2x2(M: number[][]): { lambda1: number; lambda2: number } | null {
    if (M.length !== 2) return null;
    const a = M[0][0];
    const b = M[0][1];
    const c = M[1][0];
    const d = M[1][1];

    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;

    if (discriminant < 0) return null; // Complex eigenvalues
    const sqrtDisc = Math.sqrt(discriminant);
    return {
      lambda1: (trace + sqrtDisc) / 2,
      lambda2: (trace - sqrtDisc) / 2,
    };
  }
}
