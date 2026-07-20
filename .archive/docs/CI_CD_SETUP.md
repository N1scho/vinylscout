# CI/CD Pipeline Documentation
## VinylScout - Automated Testing & Deployment

---

## 🚀 Overview

VinylScout now has a **professional-grade CI/CD pipeline** using GitHub Actions that automatically tests, builds, and deploys code changes.

### **Key Features**
✅ Automated testing on every push/PR
✅ Code quality checks (ESLint, Prettier)
✅ Security vulnerability scanning
✅ Build verification
✅ Test coverage reporting
✅ Bundle size monitoring
✅ Automatic deployment to production

---

## 📋 Workflows

### **1. Main CI/CD Pipeline** (`.github/workflows/ci.yml`)

Runs on: `push` to `main/master/develop` OR `pull_request`

**Jobs:**

#### **Lint & Code Quality**
- ✅ Runs ESLint on all source files
- ✅ Checks Prettier formatting
- ⏱️ ~30 seconds

#### **Unit & Integration Tests**
- ✅ Runs full test suite (`npm test`)
- ✅ Generates coverage report
- ✅ Uploads coverage to Codecov (optional)
- ⏱️ ~60 seconds

#### **Build Production**
- ✅ Creates production build (`npm run build`)
- ✅ Uploads build artifacts
- ✅ Reports bundle size
- ⏱️ ~45 seconds

#### **Security Audit**
- ✅ Runs `npm audit` for vulnerabilities
- ✅ Fails on critical vulnerabilities
- ✅ Warns on high severity issues
- ⏱️ ~15 seconds

#### **Deploy** (main/master only)
- ✅ Downloads build artifacts
- ✅ Deploys to Vercel (if configured)
- ⏱️ ~30 seconds

#### **Performance Analysis**
- ✅ Analyzes bundle size
- ✅ Warns if bundle >500KB
- ⏱️ ~10 seconds

**Total Pipeline Time:** ~3-5 minutes

---

### **2. Pull Request Checks** (`.github/workflows/pr-checks.yml`)

Runs on: `pull_request` (opened, synchronize, reopened)

**Jobs:**

#### **PR Title Check**
- ✅ Validates semantic commit format
- ✅ Accepts: `feat:`, `fix:`, `docs:`, etc.

#### **Code Quality Analysis**
- ✅ Runs linter with annotations
- ✅ Counts TODO/FIXME comments
- ✅ Identifies files >30KB

#### **Test Coverage Report**
- ✅ Generates coverage report
- ✅ Comments coverage on PR
- ✅ Warns if coverage <40%

#### **Build Size Analysis**
- ✅ Builds and measures bundle
- ✅ Warns if main bundle >500KB
- ✅ Reports size changes

#### **Security Vulnerability Scan**
- ✅ Deep npm audit
- ❌ **Blocks merge** if critical vulnerabilities found
- ⚠️ Warns on high severity issues

#### **Changed Files Analysis**
- ✅ Lists all changed files
- ✅ Warns if code changed but no tests added

---

## 🔧 Setup Instructions

### **1. GitHub Repository Setup**

The workflows are already committed. No additional setup needed unless you want deployment.

### **2. Vercel Deployment (Optional)**

To enable automatic deployment to Vercel:

1. **Get Vercel Token:**
   ```bash
   npm install -g vercel
   vercel login
   vercel link  # Link your project
   ```

2. **Get Project Info:**
   ```bash
   cat .vercel/project.json
   ```
   You'll see:
   ```json
   {
     "orgId": "team_xxxxxxxxxxxx",
     "projectId": "prj_xxxxxxxxxxxx"
   }
   ```

3. **Add GitHub Secrets:**
   Go to: `Repository Settings` → `Secrets and variables` → `Actions` → `New repository secret`

   Add these secrets:
   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: From `.vercel/project.json`
   - `VERCEL_PROJECT_ID`: From `.vercel/project.json`

4. **Test Deployment:**
   Push to `main` branch → Check Actions tab → Deploy job should run

### **3. Codecov (Optional)**

To enable coverage reporting:

1. Sign up at [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. Codecov token is automatically provided via GitHub app
4. Coverage reports will appear on PRs

---

## 📊 CI/CD Status Badges

Add these to your `README.md`:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/vinylscout/actions/workflows/ci.yml/badge.svg)
![PR Checks](https://github.com/YOUR_USERNAME/vinylscout/actions/workflows/pr-checks.yml/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/vinylscout/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/vinylscout)
```

---

## 🎯 Quality Gates

### **What Blocks Merging:**

❌ **Critical security vulnerabilities**
❌ **Build failures**
❌ **Test failures** (if tests exist)

### **What Generates Warnings:**

⚠️ High severity vulnerabilities
⚠️ Lint errors
⚠️ Bundle size >500KB
⚠️ Coverage <40%
⚠️ Code changes without test changes

---

## 🔍 How to Use

### **For Developers:**

#### **1. Before Committing:**
```bash
# Run tests locally
npm test

# Run linter
npm run lint

# Check formatting
npm run format:check

# Build to verify
npm run build
```

#### **2. Create Pull Request:**
- CI automatically runs all checks
- View results in "Checks" tab
- Fix any failures before requesting review

#### **3. Monitor CI:**
- Green checkmark ✅ = All good
- Red X ❌ = Failures, click for details
- Yellow warning ⚠️ = Review recommended

### **For Reviewers:**

1. Check CI status before reviewing code
2. All checks must pass (green)
3. Review warnings, use judgment
4. Security failures = do not merge

### **For Maintainers:**

1. Merge only if CI passes
2. Monitor deployment status
3. Check Codecov for coverage trends
4. Review bundle size warnings

---

## 🛠️ Customization

### **Adjust Test Coverage Threshold**

Edit `.github/workflows/pr-checks.yml`:
```yaml
if (( $(echo "$COVERAGE < 40" | bc -l) )); then  # Change 40 to your target
```

### **Adjust Bundle Size Warning**

Edit `.github/workflows/ci.yml`:
```yaml
if [ $MAIN_BUNDLE_KB -gt 500 ]; then  # Change 500 to your limit
```

### **Add More Linters**

Edit `.github/workflows/ci.yml`:
```yaml
- name: Run custom linter
  run: npm run your-custom-lint-command
```

### **Skip CI for Specific Commits**

Add to commit message:
```
[skip ci] Documentation update
```

---

## 📈 Performance Metrics

### **Current Pipeline Performance:**

| Job | Duration | Status |
|-----|----------|--------|
| Lint | ~30s | ✅ |
| Tests | ~60s | ✅ |
| Build | ~45s | ✅ |
| Security | ~15s | ✅ |
| Deploy | ~30s | ⏭️ (main only) |
| **Total** | **~3-5min** | ✅ |

### **Cost Analysis:**

- **GitHub Actions:** 2,000 minutes/month (free for public repos)
- **Current Usage:** ~5 min/push × 20 pushes/month = **100 min/month**
- **Remaining:** 1,900 minutes
- **Cost:** $0/month ✅

---

## 🐛 Troubleshooting

### **"Build Failed" Error**

```bash
# Reproduce locally:
npm ci
npm run build

# Check error message
# Fix issues, commit, push
```

### **"Tests Failed" Error**

```bash
# Run tests locally:
npm test

# Debug specific test:
npm test -- path/to/test.js

# Fix tests, commit, push
```

### **"Security Audit Failed" Error**

```bash
# Check vulnerabilities:
npm audit

# Fix automatically (if possible):
npm audit fix

# Manual fix for critical issues:
npm install package@version

# Update and test:
npm test
npm run build
```

### **"Deployment Failed" Error**

1. Check Vercel secrets are correct
2. Verify project linked: `vercel link`
3. Test deploy manually: `vercel --prod`
4. Check Vercel logs in dashboard

---

## 📝 CI/CD Best Practices

### **DO:**

✅ Run tests locally before pushing
✅ Keep CI fast (<5 minutes)
✅ Fix failures immediately
✅ Monitor coverage trends
✅ Review security warnings

### **DON'T:**

❌ Push directly to main without CI
❌ Merge PRs with failing checks
❌ Ignore security warnings
❌ Skip writing tests for new features
❌ Commit large files (keep builds fast)

---

## 🔐 Security Considerations

### **Secrets Management:**

- ✅ Never commit secrets to code
- ✅ Use GitHub Secrets for tokens
- ✅ Rotate secrets periodically
- ✅ Limit secret access (maintainers only)

### **Branch Protection Rules (Recommended):**

Go to: `Repository Settings` → `Branches` → `Add rule`

Set for `main` branch:
- ✅ Require pull request before merging
- ✅ Require status checks to pass:
  - `Lint & Code Quality`
  - `Unit & Integration Tests`
  - `Build Production`
  - `Security Vulnerability Scan`
- ✅ Require conversation resolution
- ✅ Do not allow bypassing

---

## 📊 Metrics & Monitoring

### **What We Track:**

1. **Test Coverage:** Target 40%+ (currently ~20%)
2. **Bundle Size:** Target <500KB (currently ~410KB)
3. **Build Time:** Target <20s (currently ~18s)
4. **Security:** Zero critical vulnerabilities
5. **Lint Errors:** Target 0 (currently 3)

### **How to View:**

- **Coverage:** Codecov dashboard or PR comments
- **Bundle Size:** CI logs or PR checks
- **Security:** GitHub Security tab
- **Build Time:** Actions tab

---

## 🚀 Future Improvements

### **Planned Enhancements:**

- [ ] Add E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Lighthouse CI for web vitals
- [ ] Automatic dependency updates (Dependabot)
- [ ] Storybook deployment
- [ ] Multiple deployment environments (staging/prod)

---

## 📞 Support

### **CI/CD Issues:**

1. Check Actions tab for error details
2. Review this documentation
3. Test locally to reproduce
4. Check GitHub Actions status page
5. Contact maintainers if blocked

### **Deployment Issues:**

1. Verify secrets are set
2. Check Vercel dashboard
3. Review deployment logs
4. Test manual deployment
5. Contact DevOps team

---

## ✅ Checklist for New Developers

Before your first contribution:

- [ ] Read this CI/CD documentation
- [ ] Run `npm install` successfully
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - successful
- [ ] Create a test PR to see CI in action
- [ ] Understand the quality gates
- [ ] Know how to fix common CI failures

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Codecov Documentation](https://docs.codecov.com)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

*End of CI/CD Documentation*
*Professional DevOps Implementation*
*December 2, 2025*
