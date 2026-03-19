# CRM Builder Deployment (Vercel + GitHub Actions)

This app is configured for automatic Vercel deployment from GitHub:

- Production deploy: every push to `main` (when CRM files change)
- Preview deploy: every pull request

Workflow file:

- `/Users/junglelabs/Documents/New project/.github/workflows/deploy-crm-builder-vercel.yml`

## 1) One-time Vercel project link

From project root:

```bash
cd "/Users/junglelabs/Documents/New project/apps/crm-builder-web"
vercel login
vercel link
```

Choose:

- existing/new Vercel project
- correct team/account
- this directory as the project root

## 2) Get Vercel IDs for GitHub Secrets

After `vercel link`, open:

```bash
cat .vercel/project.json
```

Copy:

- `orgId` -> `VERCEL_ORG_ID`
- `projectId` -> `VERCEL_PROJECT_ID`

## 3) Create Vercel token

- Vercel Dashboard -> Settings -> Tokens
- Create token
- Save as GitHub secret: `VERCEL_TOKEN`

## 4) Add GitHub repository secrets

GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret

Add all 3:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 5) Push to trigger deployment

```bash
cd "/Users/junglelabs/Documents/New project"
git add .
git commit -m "chore: enable crm-builder vercel auto deploy"
git push origin main
```

## 6) Verify

- GitHub -> Actions -> `Deploy CRM Builder to Vercel`
- Vercel Dashboard -> Deployment logs

## Notes

- App path deployed by workflow: `apps/crm-builder-web`
- Local runtime is still available via:
  - `npm run dev:crm-core-api`
  - `npm run dev:crm-builder`
