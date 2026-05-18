# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main) | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability in COGNARA, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the project owner directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. We will acknowledge within 48 hours and provide a fix timeline

## Security Measures

### Authentication & Authorization
- **Supabase Auth** with JWT tokens and server-side session verification
- **Row Level Security (RLS)** on all 30+ database tables
- **Role-based access** — Student, Coach, Admin with separate route groups
- **ID spoofing prevention** — server-side user ID verification on all API routes

### Input Security
- **Zod validation** on all API endpoints with strict schemas
- **XSS sanitization** — all user input stripped of scripts and dangerous HTML
- **Code size limits** — max 50KB per code submission
- **Message length limits** — max 5,000 characters per AI message

### Rate Limiting
- **Sliding window** rate limiter on all API routes
- **Dual enforcement** — per IP address AND per authenticated user ID
- **Agent API** — prevents credit burning attacks

### HTTP Security Headers
All responses include:
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### File Upload Security
- **Type validation** — only PDF, JPG, PNG accepted
- **Size limit** — max 10MB per file
- **Storage** — Supabase Storage with bucket-level policies
- **Path isolation** — each user's files stored in their own directory

### Environment Variables
All secrets are loaded via `process.env`:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `JDOODLE_CLIENT_ID` / `JDOODLE_CLIENT_SECRET`
- Never committed to version control (protected by `.gitignore`)

## Dependencies

We use `npm audit` regularly. All dependencies are pinned to specific versions.
