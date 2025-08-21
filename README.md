# HydroDesigner

This is a NextJS application for hydraulic engineering design.

To get started, take a look at src/app/page.tsx.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Testing

To run tests:

```bash
pnpm test
```

## CI

This project uses GitHub Actions for continuous integration. The workflow is defined in `.github/workflows/ci.yml` and runs on every push to the `main` branch and on pull requests.

The CI pipeline includes:
- Dependency installation with `pnpm install --frozen-lockfile`
- Linting with `pnpm lint`
- Type checking with `pnpm typecheck`
- Testing with `pnpm test`
- Building with `pnpm build`

## Security Headers

This application sets several security headers including Content Security Policy (CSP) to enhance security. The headers are configured in `next.config.ts`.

To modify the Content Security Policy, edit the `headers()` function in `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: `
            default-src 'self';
            script-src 'self' 'unsafe-inline' 'unsafe-eval' vercel.live;
            style-src 'self' 'unsafe-inline' fonts.googleapis.com;
            img-src 'self' data: blob:;
            font-src 'self' fonts.gstatic.com;
            connect-src 'self' https: wss:;
            frame-ancestors 'none';
          `.replace(/\s{2,}/g, ' ').trim()
        },
        // Other headers...
      ]
    }
  ];
}
```

## Contribution Guidelines

All pull requests must pass the check script:

```bash
pnpm check
```

This script runs linting, type checking, and tests to ensure code quality.
