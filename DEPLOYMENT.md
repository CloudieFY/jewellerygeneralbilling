# CI/CD and Deployment Guide

This guide outlines how Continuous Integration (CI) and Continuous Deployment (CD) are configured for the Jewellery General Billing application, and how to run or deploy the stack.

---

## 🛠️ Architecture Overview

- **Frontend**: React + Vite (Port `5173`)
- **Backend**: Express / Node.js API (Port `5000`)
- **Database**: MongoDB (Local container or MongoDB Atlas)
- **CI/CD Platform**: GitHub Actions
- **Container Registry**: GitHub Container Registry (`ghcr.io`)
- **Containerization**: Docker & Docker Compose

---

## 🔄 CI/CD Pipelines

### 1. Continuous Integration (`.github/workflows/ci.yml`)
Runs automatically on **Pull Requests** and **Pushes** to `main` / `master` branches:
- **Backend CI**: Installs dependencies, runs code check (`npm test`), and builds the backend Docker container image.
- **Frontend CI**: Installs dependencies, runs ESLint (`npm run lint`), compiles Vite production bundle (`npm run build`), and builds the frontend Docker container image.

### 2. Continuous Deployment (`.github/workflows/cd.yml`)
Runs automatically on **Pushes to `main` / `master`** or tag releases (`v*`):
- Builds Docker images for backend and frontend.
- Tags images with `latest` and commit SHA.
- Publishes images to **GitHub Container Registry** (`ghcr.io`).
- Triggers remote server deployment via SSH if `DEPLOY_HOST` variable is set.

---

## 🔐 GitHub Secrets Setup (Optional for Automated Deployment)

To enable automatic deployment to your cloud VPS (DigitalOcean, AWS EC2, Linode, etc.), navigate to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** and add:

| Secret / Variable Name | Required | Description |
|---|---|---|
| `DEPLOY_HOST` (Variable) | Optional | Server IP address or hostname |
| `DEPLOY_USER` | Optional | SSH Username (e.g., `ubuntu` or `root`) |
| `DEPLOY_SSH_KEY` | Optional | Private SSH key matching the server |

---

## 🚀 Running Locally with Docker Compose

You can start the entire application stack (Database, Backend, Frontend) with a single command:

```bash
# Clone the repository
git clone <your-repo-url>
cd generalbillingjewellerey

# Start all services
docker compose up -d --build
```

Access the apps at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **MongoDB**: `localhost:27017`

To stop the services:
```bash
docker compose down
```

---

## 🌐 Production Server Deployment Setup

1. Copy `docker-compose.prod.yml` to your server (e.g. `/opt/jewellery-billing/docker-compose.yml`).
2. Create a `.env` file in the same directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://mongodb:27017/billing
   JWT_SECRET=your_secure_jwt_secret_here
   ```
3. Login to GitHub Container Registry on your server:
   ```bash
   echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```
4. Start the production stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
