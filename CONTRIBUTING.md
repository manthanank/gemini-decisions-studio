# Contributing Guidelines

Contributions, bug fixes, new workflow templates, and UI improvements are welcome.

## Development Workflow

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Verify TypeScript types, unit tests, and the production build before opening a Pull Request:
   ```bash
   npx tsc --noEmit
   npm test
   npm run build
   ```

## Standards

- **TypeScript**: Strict mode is enabled in `tsconfig.json`. Avoid `any` outside isolated SDK boundary casts.
- **Decisions API Best Practices**:
  - Keep question keys matching `[A-Za-z0-9_-]{1,64}`.
  - Write full, positive-phrased questions in `instructions` (the model never sees question keys).
  - Use non-positional fallback option keys such as `other` rather than `none_of_the_above`.
- **Responsive UI**: Test layouts across mobile (`360px`), tablet (`768px`), and desktop (`1280px+`) viewports.
