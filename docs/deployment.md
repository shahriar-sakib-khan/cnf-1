# Deployment and Versioning Guide

This guide explains how to connect your project to GitHub, manage versions, and deploy to Render.

## 1. Git Connection

We have already connected your local project to: `https://github.com/shahriar-sakib-khan/cnf-1.git`.

**To push your latest changes:**
1. Commit your changes: `git add . && git commit -m "Your message"`
2. Push to main: `git push origin main`

## 2. Versioning with Changesets

This project uses **Changesets** for semantic versioning.

**Workflow:**
1. When you finish a feature, run: `pnpm changeset`
2. Follow the prompts to select the packages affected and the version bump level (patch, minor, major).
3. Commit the generated summary file.
4. When ready to release, run: `pnpm version` (this updates `package.json` files and creates a changelog).
5. Commit and push.

## 3. Render Deployment

We have added a `render.yaml` Blueprint file.

**Setup Instructions:**
1. Log in to [Render](https://dashboard.render.com/).
2. Click **New** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect the `render.yaml` and configure the **cnf-api** and **cnf-web** services.
5. **Important**: Go to the **cnf-api** service settings and manually add the following Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random string.
   - `CLOUDINARY_CLOUD_NAME`: From your Cloudinary dashboard.
   - `CLOUDINARY_API_KEY`: From your Cloudinary dashboard.
   - `CLOUDINARY_API_SECRET`: From your Cloudinary dashboard.

## 4. Environment Variables Checklist

Ensure these are set in your Render Dashboard:

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Full connection string |
| `JWT_SECRET` | Secret for token signing |
| `PORT` | Set to `3000` (pre-configured in `render.yaml`) |
| `CLOUDINARY_*` | API credentials for uploads |
| `VITE_API_URL` | Frontend pointer to Backend (e.g., `https://cnf-api.onrender.com/api`) |
