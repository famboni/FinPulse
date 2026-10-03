# FinPulse 90+ | Personal Finance & Bank CSV Analyzer

A privacy-first, 100% browser-based personal finance analyzer that processes bank `.csv` exports locally in your browser.

## Features
- **Universal CSV Importer & Column Mapper:** Supports single signed amount columns or separate Debit/Credit columns across NZ, AU, US, and UK bank CSV formats.
- **Complete Incomings & Outgoings Summary + Full-Duration Bar Chart:** Shows 100% of money in and money out (including one-off big purchases) by month or week.
- **3-Layer Smart Merchant Lookup & Auto-Categorizer:** Automatically cleans noisy bank descriptions and categorizes merchants across 22 categories (including `Education`, `Credit Cards`, `General`, and `Uncategorized`) using a built-in brand dictionary, industry keywords, and OpenStreetMap's public business directory.
- **Red Flags & Financial Health Score (0–100):** Detects free-trial traps, silent bill/subscription price increases, overlapping subscriptions, small daily purchases (`≤$18`), post-payday spending spikes, Buy Now Pay Later stacking, and pre-payday low-balance days—with plain-English step-by-step advice.
- **Interactive Savings Planner:** Test canceling subscriptions or trimming habits to see your projected monthly and yearly savings.

---

## Running Locally

```bash
npm install
npm run dev
```

## Deploying to GitHub Pages (Automatic)

This repository includes a pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`) and relative asset paths (`base: './'` in `vite.config.ts`).

1. Create a new repository on [GitHub](https://github.com/new).
2. Push this project's files to the `main` branch of your new repository.
3. In your GitHub repository, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, select **GitHub Actions**.
5. GitHub will automatically build and publish your live app at:
   `https://<your-github-username>.github.io/<your-repo-name>/`
