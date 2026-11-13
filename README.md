# HabInyera

## Deploy to Render

This repository is a Vite static site. Create a Render Static Site from the
repository and use these settings:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`

Alternatively, create a Render Blueprint from this repository; `render.yaml`
contains the static-site build and publish settings.

The site stores its demo inventory and orders in each visitor's browser. Deploying
the frontend does not deploy a backend or persist data between browsers.

