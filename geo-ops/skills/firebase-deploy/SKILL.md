---
name: firebase-deploy
description: Builds the project and deploys to Firebase Hosting. Use when the user says /firebase-deploy or asks to deploy.
allowed-tools: Bash(yarn build), Bash(firebase deploy*)
---

# Firebase Deploy

Builds the project with `yarn build` and deploys to Firebase.

## Steps

1. Run `yarn build`
2. If build succeeds, run `firebase deploy`
3. Report the result (hosting URL or error)

## Rules

- ALWAYS run build first. Do NOT deploy if build fails.
- Show the hosting URL from the deploy output when done.
