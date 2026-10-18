# GitHub repository setup

The ChatGPT GitHub connection currently has repository-scoped write access but does not expose a create-repository action.

1. Sign in as `dionpram` and create a **private**, empty repository named `access-lens`: https://github.com/new?name=access-lens
2. Choose **no README, .gitignore, or license** because this starter includes README and .gitignore and licensing can be decided separately.
3. Grant the ChatGPT GitHub app access to the repository at: https://github.com/settings/installations/163900747 (Repository access > select `access-lens`).
4. Return to ChatGPT and ask it to upload the Access Lens starter to `dionpram/access-lens` using GitHub tools.

## Alternative: push from your machine

```bash
cd access-lens-starter
git init -b main
git add .
git commit -m "Initial Access Lens starter"
git remote add origin https://github.com/dionpram/access-lens.git
git push -u origin main
```

## Note

The scanner is a development proof of concept. Do not deploy the scan endpoint publicly without the isolation, network controls, and abuse protections explained in README.md and docs/ROADMAP.md.
