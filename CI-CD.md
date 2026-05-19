# CI/CD Pipeline Documentation

## Overview
Aplikasi Lares menggunakan GitHub Actions untuk automated testing, building, dan deployment.

## Workflows

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

Pipeline utama yang berjalan pada setiap push dan pull request ke branch `main` dan `develop`.

#### Jobs

##### Lint & Type Check
- Runs TypeScript type checking
- Validates code formatting (Prettier)
- Ensures code quality standards

```yaml
Triggers: push, pull_request
Branches: main, develop
Node Version: 20
```

##### Build Application
- Compiles TypeScript
- Bundles frontend assets
- Creates production-ready build
- Uploads build artifacts (retained 7 days)

```yaml
Dependencies: lint job
Artifacts: dist/ folder
```

##### Run Tests
- Executes unit tests (if available)
- Runs integration tests
- Validates functionality

```yaml
Dependencies: lint job
Continues on error: true (until tests are added)
```

##### Security Audit
- Runs `npm audit` for vulnerabilities
- Checks for outdated dependencies
- Generates security report
- Uploads audit report (retained 30 days)

```yaml
Audit Level: moderate
Continues on error: true
```

##### Deploy to Staging
- Deploys to staging environment
- Only runs on `develop` branch
- Requires successful build and tests

```yaml
Trigger: push to develop
Dependencies: build, test
```

##### Deploy to Production
- Deploys to production environment
- Only runs on `main` branch
- Requires successful build and tests

```yaml
Trigger: push to main
Dependencies: build, test
```

### 2. Dependency Update (`.github/workflows/dependency-update.yml`)

Automated dependency updates yang berjalan setiap Senin pukul 9 AM UTC.

#### Features
- Updates all npm dependencies
- Runs tests to ensure compatibility
- Creates pull request automatically
- Can be triggered manually via workflow_dispatch

```yaml
Schedule: Every Monday 9 AM UTC
Manual Trigger: Available
```

## Setup Instructions

### 1. GitHub Secrets
Tidak ada secrets yang diperlukan untuk basic setup. Untuk deployment, tambahkan:

```bash
# Optional: untuk deployment
DEPLOY_KEY          # SSH key untuk deployment
STAGING_SERVER      # Staging server URL
PRODUCTION_SERVER   # Production server URL
```

### 2. Branch Protection Rules

Recommended settings untuk `main` branch:
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
  - lint
  - build
  - test
- ✅ Require branches to be up to date
- ✅ Include administrators

### 3. Deployment Configuration

#### Staging Deployment
Edit `.github/workflows/ci.yml` line ~140:

```yaml
- name: Deploy to staging
  run: |
    # Example: Deploy ke server via rsync
    rsync -avz --delete dist/ user@staging-server:/var/www/lares/
    
    # Example: Deploy ke Cloud Run
    gcloud run deploy lares-staging \
      --source . \
      --region asia-southeast1
    
    # Example: Deploy ke Vercel
    vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

#### Production Deployment
Edit `.github/workflows/ci.yml` line ~160:

```yaml
- name: Deploy to production
  run: |
    # Add your production deployment commands
    # Same options as staging
```

## Workflow Status Badges

Add to README.md:

```markdown
![CI/CD](https://github.com/YOUR_USERNAME/lares-app/workflows/CI%2FCD%20Pipeline/badge.svg)
![Dependencies](https://github.com/YOUR_USERNAME/lares-app/workflows/Dependency%20Update/badge.svg)
```

## Local Testing

Test workflows locally menggunakan [act](https://github.com/nektos/act):

```bash
# Install act
npm install -g act

# Run CI workflow
act push

# Run specific job
act -j build

# Run with secrets
act -s GITHUB_TOKEN=your_token
```

## Monitoring

### View Workflow Runs
1. Go to GitHub repository
2. Click "Actions" tab
3. Select workflow
4. View run details

### Artifacts
Build artifacts tersedia di workflow run:
- **dist/** - Production build (7 days retention)
- **security-audit** - npm audit report (30 days retention)

### Notifications
Configure notifications di GitHub Settings:
- Settings → Notifications → Actions
- Enable email/Slack notifications untuk workflow failures

## Troubleshooting

### Build Failures

**TypeScript Errors:**
```bash
# Run locally
npm run lint

# Fix automatically
npx tsc --noEmit
```

**Dependency Issues:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm update
```

### Deployment Failures

**SSH Connection:**
```bash
# Test SSH connection
ssh user@server

# Verify SSH key
ssh-keygen -l -f ~/.ssh/id_rsa
```

**Permission Issues:**
```bash
# Check file permissions
ls -la dist/

# Fix permissions
chmod -R 755 dist/
```

## Best Practices

### Commit Messages
Follow conventional commits:
```
feat: add new feature
fix: bug fix
docs: documentation update
chore: maintenance tasks
test: add tests
ci: CI/CD changes
```

### Pull Requests
- Create feature branches from `develop`
- Ensure all checks pass before merging
- Request code review
- Squash commits when merging

### Versioning
Use semantic versioning:
```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

## Advanced Configuration

### Matrix Builds
Test multiple Node versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
```

### Caching
Speed up builds with caching:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Parallel Jobs
Run jobs in parallel:

```yaml
jobs:
  test-unit:
    runs-on: ubuntu-latest
  test-integration:
    runs-on: ubuntu-latest
```

## Cost Optimization

GitHub Actions free tier:
- 2,000 minutes/month untuk private repos
- Unlimited untuk public repos

Tips untuk menghemat:
- Use caching untuk dependencies
- Skip redundant jobs dengan conditions
- Cancel in-progress runs untuk outdated commits

## Support

Untuk issues dengan CI/CD:
1. Check workflow logs
2. Review GitHub Actions documentation
3. Test locally dengan `act`
4. Open issue di repository
