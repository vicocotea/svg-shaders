# Deployment Guide - GitHub Pages

This guide will help you deploy your SVG Shaders project to GitHub Pages.

## Prerequisites

1. Make sure your code is pushed to a GitHub repository
2. Ensure you have admin access to the repository

## Setup Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section (in the left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

### 2. Configure GitHub Actions

The workflow file `.github/workflows/deploy.yml` has been created and will automatically:
- Build your Next.js application
- Deploy it to GitHub Pages
- Run on every push to the `main` branch

### 3. Push Your Code

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### 4. Monitor Deployment

1. Go to your repository on GitHub
2. Click on **Actions** tab
3. You should see the "Deploy to GitHub Pages" workflow running
4. Wait for it to complete (usually takes 2-3 minutes)

### 5. Access Your Site

Once deployment is complete, your site will be available at:
`https://[your-username].github.io/[repository-name]`

## Troubleshooting

- If the deployment fails, check the **Actions** tab for error messages
- Make sure all dependencies are properly listed in `package.json`
- Verify that your `next.config.js` has `output: 'export'` configured

## Local Development

To test the build locally before deploying:

```bash
npm run build
```

This will create a static export in the `out` directory that matches what will be deployed to GitHub Pages. 