# Website Development Guide

## Steps to Create a Good Website

### 1. Define Goals and Audience
- Clarify the website's purpose (portfolio, e-commerce, blog, SaaS, etc.)
- Identify the target audience and their needs
- Define success metrics (conversions, traffic, engagement)

### 2. Plan the Structure
- Create a sitemap listing all pages and their hierarchy
- Sketch user flows for key tasks (e.g., signup, purchase, contact)
- Write a content outline for each page before writing a line of code

### 3. Choose the Right Stack
- **Static sites**: HTML/CSS/JS, Astro, or Next.js with static export
- **Content-heavy**: Next.js, Nuxt, or SvelteKit with a headless CMS
- **E-commerce**: Shopify, or Next.js + Stripe + a CMS
- **Full-stack apps**: Next.js / Remix / SvelteKit + a database (Postgres, SQLite)
- Match the stack to team expertise and project scale — don't over-engineer

### 4. Design First, Code Second
- Define a color palette (2–3 primary colors + neutrals)
- Pick a type scale (font sizes, weights, line heights)
- Design in Figma or a similar tool before writing CSS
- Prioritize mobile-first layouts; desktop is an enhancement

### 5. Build a Solid Foundation
- Set up version control (Git) from day one
- Use a consistent folder structure (`/components`, `/pages`, `/styles`, `/public`)
- Configure a linter (ESLint) and formatter (Prettier) early
- Add a `CLAUDE.md` (this file) or `README.md` documenting setup steps

### 6. Core Technical Practices
- **Performance**: lazy-load images, minimize JS bundle, use a CDN
- **Accessibility**: semantic HTML, ARIA labels where needed, keyboard navigation, sufficient color contrast (WCAG AA)
- **SEO**: unique `<title>` and `<meta description>` per page, proper heading hierarchy, structured data where relevant
- **Security**: HTTPS only, sanitize all user input, use Content Security Policy headers, never expose secrets in frontend code

### 7. Responsive Design
- Use CSS Grid and Flexbox for layouts
- Test on real devices or browser dev tools at common breakpoints (375px, 768px, 1280px)
- Ensure touch targets are at least 44×44px on mobile

### 8. Content and Copy
- Write clear, concise copy — lead with value, not features
- Use real content (not Lorem Ipsum) during development to catch layout breaks
- Compress and properly size all images (WebP format preferred)

### 9. Testing Before Launch
- Cross-browser test: Chrome, Firefox, Safari, Edge
- Run Lighthouse audits for Performance, Accessibility, SEO (target 90+ scores)
- Test all forms, links, and interactive elements
- Check 404 handling and error states

### 10. Deploy and Monitor
- Use a CI/CD pipeline (GitHub Actions, Vercel, Netlify) for automated deploys
- Set up error monitoring (Sentry or similar)
- Add analytics (Plausible, Fathom, or Google Analytics) to measure real usage
- Configure uptime monitoring and alerts

### 11. Post-Launch
- Gather user feedback early and iterate
- Monitor Core Web Vitals (LCP, CLS, INP) in Google Search Console
- Keep dependencies updated to avoid security vulnerabilities
- Document decisions and known limitations in this file
