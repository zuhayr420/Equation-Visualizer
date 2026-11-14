# MathVision – Mathematics, Made Visible

[![Client-Side Architecture](https://img.shields.io/badge/Architecture-100%25%20In--Browser-blue.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](#)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)

**MathVision** is a professional, frontend-only interactive mathematical visualization, computation, and learning platform. It allows users to enter mathematical equations, solve them with step-by-step verified proofs, explore interactive 2D and 3D graphs, inspect calculus dynamics (tangent lines, Riemann sums, limits, Taylor series), and learn through an integrated AI mathematics tutor.

The entire core application executes directly inside the user's browser with **zero traditional backend requirements** (no Node.js backend server, no Python/Flask/FastAPI/Django, and no backend database server).

---

## 🌟 Key Capabilities

### 1. 2D Graph Explorer (Plotly.js)
- Explicit functions: $y = f(x)$
- Implicit equations: $x^2 + y^2 = 25$, ellipses, hyperbolas, lemniscates via continuous 2D contour slices
- Polar functions: $r = f(\theta)$
- Parametric curves: $x = f(t), y = g(t)$
- Automated mathematical analysis:
  - Exact roots and $x$-intercepts
  - $y$-intercepts
  - Critical points (local minima, local maxima, vertices)
  - Vertical and horizontal asymptotes
  - Monotonicity intervals (increasing / decreasing)
  - Real-time coordinate tracing and pan/zoom sync
  - Export to PNG and SVG

### 2. 3D Visualisation Studio (Three.js WebGL)
- 3D continuous surface manifolds: $z = f(x, y)$
- Interactive orbital navigation (rotate, pan, zoom, reset camera)
- Colormaps: Viridis, Plasma, CoolWarm, Spectral, and Cyberpunk Neon
- Dynamic time-parameter animation $t$ (e.g., $z = \sin(\sqrt{x^2+y^2} - t)$)
- Surface resolution slider (25x25 to 110x110 vertices)
- Wireframe overlays, 3D floor grids, and coordinate axes helpers
- One-click WebGL snapshot export

### 3. Equation Solver & Step-by-Step Proofs
- **Algebra**: Symbolic equation solving, polynomial roots, factorization, expansion, and simplification
- **Calculus**: Symbolic differentiation $f'(x)$, indefinite integrals $\int f(x) dx$, definite integrals $\int_a^b f(x) dx$, and limits $\lim_{x \to a} f(x)$
- **Linear Algebra**: Matrix addition, multiplication, determinants $\det(A)$, inverses $A^{-1}$, transposes, and 2x2 eigenvalues $\lambda$
- **Numerical Methods**: Real root finding via interval scanning, bisection, and Newton-Raphson polishing
- **Verified Proofs**: Every solution renders individual transformation steps, mathematical explanations, LaTeX expressions, and verification badges

### 4. Calculus Lab
- **Differentiation Visualizer**: Draggable point $x_0$, dynamic tangent line $y - y_0 = m(x - x_0)$, live slope indicator, automated curve movement animation, and overlay of $f'(x)$
- **Integration Visualizer**: Definite integrals over $[a, b]$, interactive Riemann rectangles (Left, Right, Midpoint, Trapezoid, Simpson's rule), adjustable slice count $N$, and exact vs. approximate area comparison
- **Limits Visualizer**: Left-hand $\lim_{x \to a^-}$, right-hand $\lim_{x \to a^+}$, and two-sided limit convergence tables with $\Delta \to 0$
- **Taylor Series Visualizer**: Computes Taylor polynomials $P_N(x)$ around center $a$ up to order 6, plotting how polynomial approximations converge onto arbitrary curves

### 5. AI Mathematics Tutor
- Natural language conceptual explanations and practice problems
- **Engine-First Architecture**: Extracts mathematical expressions and executes them against local symbolic/numerical engines first so the AI **never hallucinates or fabricates calculations**
- Multi-provider support:
  - **Local Verified Engine Tutor** (100% offline, free, zero API key required)
  - Google Gemini API (`gemini-1.5-flash`, `gemini-1.5-pro`)
  - OpenAI API (`gpt-4o`, `gpt-4o-mini`)
  - Anthropic Claude API (`claude-3-5-sonnet`)
  - Custom Serverless proxy endpoint

### 6. Local Storage & Project Library (IndexedDB)
- Complete workspace persistence using IndexedDB
- Create, rename, duplicate, delete, and switch between projects
- Export projects to JSON and import JSON project files with schema validation
- Complete audit calculation history with CSV export
- Dark & Light mode theme persistence via LocalStorage

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Design System** | Tailwind CSS, Lucide React Icons |
| **State Management** | Zustand |
| **Mathematical Engine** | Math.js, Nerdamer, KaTeX |
| **2D Graphing** | Plotly.js |
| **3D Rendering** | Three.js (WebGL), OrbitControls |
| **Persistence** | IndexedDB (`idb`), LocalStorage |
| **Export Services** | jsPDF, html2canvas, Canvas API |
| **Testing** | Vitest, React Testing Library |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mathvision.git
cd mathvision

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

The compiled, minified production assets will be output to the `dist/` directory.

---

## 📦 Build & Static Hosting

MathVision is compiled as static HTML, CSS, and JavaScript with zero backend runtime requirements:

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

The generated files in `dist/` can be served by any static file server or static web host.

---

## 🔒 Security & Privacy

- **Strict Expression Parser**: No user inputs are ever passed to `eval()` or `Function()`. Mathematical expressions pass through a token validator and restricted abstract syntax tree compilers.
- **Client-Side Key Storage**: Any third-party AI API key entered in Settings is stored exclusively in your browser's private `localStorage`. Keys are never transmitted to external servers except directly to the selected provider endpoint.

---

## 📄 License

This project is licensed under the MIT License.
