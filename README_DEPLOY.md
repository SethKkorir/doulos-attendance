# Hosting Doulos Attendance on Vercel

The project has been configured for easy deployment on Vercel. Follow these steps:

## 1. Connect to GitHub
- Push your code to a GitHub repository.
- Go to [Vercel](https://vercel.com) and click **"Add New"** > **"Project"**.
- Import your repository.

## 2. Configure Build Settings
Vercel should automatically detect the settings from `vercel.json` and the root `package.json`, but ensure these are set if prompted:
- **Build Command**: `npm run build`
- **Output Directory**: `client/dist` (Vercel should handle this automatically via `vercel.json`)
- **Install Command**: `npm run install:all`

## 3. Set Environment Variables
In the Vercel project settings, add the following **Environment Variables**:

| Variable | Recommended Value |
| :--- | :--- |
| `MONGO_URI` | Your MongoDB Atlas connection string (Localhost won't work in production) |
| `JWT_SECRET` | Create a long random string (e.g., `doulos_solidarity_secret_99`) |
| `ADMIN_PASSWORD` | The password for your Admin dashboard |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

## 4. Important Notes
- **Database**: You MUST use a cloud database like **MongoDB Atlas** for the hosted version. Local MongoDB (`localhost:27017`) will not work on Vercel.
- **API URL**: The frontend is already configured to automatically detect the API URL when hosted on the same Vercel domain.

## 5. Deployment
Click **Deploy**! Your app will be live at a `.vercel.app` URL.
