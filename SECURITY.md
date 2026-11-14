# Security Policy

## Supported Versions

We actively maintain and provide security updates for the latest major release of MathVision:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Architecture Security Guarantees

MathVision is architected as a pure, client-side browser application:
- **Zero Server-Side Storage**: Mathematical equations, computation history, and projects are persisted strictly within the client's local browser via IndexedDB (`idb`) and `localStorage`.
- **Zero Eval Execution**: User mathematical inputs are validated and compiled using AST abstract syntax trees with math.js and nerdamer. No arbitrary code execution or native JavaScript `eval()` is permitted.
- **Client-Side Key Isolation**: Optional third-party AI keys (Google Gemini, OpenAI, Anthropic) are held exclusively in the user's browser memory and `localStorage`. Keys are never forwarded to any third-party intermediary server.

---

## Reporting a Vulnerability

If you discover a security vulnerability within MathVision, please report it responsibly:

1. **Email Disclosure**: Send details to [zuh1234ayr@gmail.com](mailto:zuh1234ayr@gmail.com).
2. **Details to Include**:
   - Description of the vulnerability and its potential impact.
   - Steps to reproduce or proof-of-concept expression.
   - Affected component (e.g. parser, 3D WebGL renderer, export service).
3. **Response Timeline**:
   - Acknowledge receipt within **48 hours**.
   - Remediation patch and release within **7 business days**.

Please do not open public GitHub issues for sensitive security vulnerabilities until a patch has been published.
