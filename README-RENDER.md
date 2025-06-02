
# 🛍 Ecommerce App – Full Stack Deployment with Render & GitHub Actions

This repository contains a full-stack ecommerce application built with:

- **Frontend**: Vite + React (Node.js)
- **Backend**: ASP.NET Core (.NET 8)
- **CI/CD**: GitHub Actions
- **Hosting**: Render

##  Project Structure

```
.
├── .github/workflows/deploy.yml   # GitHub Actions deployment pipeline
├── ecommerce.client/              # Frontend project (Vite)
└── Ecommerce.Server/              # Backend project (.NET 8 Web API)
├── Dockerfile                     # Multi-stage Dockerfile for building and running the app
```

---

##  Deployment Workflow

The deployment is fully automated using GitHub Actions and Render’s deploy hook.

### Trigger

- Runs on every push to the `master` branch.

### Steps

1. **Checkout the code**
2. **Trigger deployment** on Render using `RENDER_DEPLOY_HOOK` secret
3. **Build Frontend** using Node 18 and Vite
4. **Build Backend** using .NET 8 SDK
5. **Publish** the backend and combine frontend build output into `/wwwroot`
6. **Run** the app using ASP.NET Core runtime

---

## Dockerfile Overview

This setup uses a **multi-stage Docker build**:

### Frontend Stage (`client-build`)
- Installs dependencies
- Builds the Vite app
- Outputs static files to `/client/dist`

### Backend Stage (`server-build`)
- Removes frontend project reference from `.csproj` for clean Docker build
- Builds and publishes the .NET backend

### Final Stage (`final`)
- Copies published backend files and static frontend files into `/wwwroot`
- Configures runtime for production (port, environment, HTTPS, forwarded headers)

---

## Environment Variables

The following environment variables are set for the final container:

```env
PORT=10000
ASPNETCORE_URLS=http://+:10000
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
VITE_SERVER_OPTIONS_HTTPS=false
```

---

## GitHub Secrets Required

To enable deployment, you need to configure the following secret:

`RENDER_DEPLOY_HOOK` | Your Render deploy hook URL (POST)   


## 📡 CI/CD with GitHub Actions

The GitHub Actions workflow file is located at `.github/workflows/deploy.yml`.

To customize or extend the CI/CD pipeline, edit this file as needed.

---