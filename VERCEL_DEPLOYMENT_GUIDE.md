# Vercel Deployment Guide for Les Dunes d'Or

This guide explains how to deploy the Les Dunes d'Or website on Vercel.

## 1. Frontend Deployment (React Application)

### Before deploying:

1. Ensure the `.env.production` file is properly set up with:
   ```
   REACT_APP_API_URL=https://les-dunes-server.vercel.app  (or your chosen backend URL)
   REACT_APP_SUPABASE_URL=YOUR_SUPABASE_URL
   REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

2. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase credentials.

### Deployment Steps:

1. Login to Vercel (https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository or upload the project directly
4. Configure the project:
   - Framework Preset: Create React App
   - Root Directory: `./` (main project folder)
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Add Environment Variables:
   - Add each variable from your `.env.production` file
6. Click "Deploy"

## 2. Backend Deployment (Express Server)

### Before deploying:

1. Go to the server directory: `cd server`
2. The `vercel.json` file is already set up correctly.

### Deployment Steps:

1. Login to Vercel
2. Click "Add New" → "Project"
3. Import from GitHub or upload the server directory
4. Configure the project:
   - Root Directory: `./server`
   - Framework Preset: Other
5. Add Environment Variables:
   - `BREVO_API_KEY`: Your Brevo API Key
   - Any other secrets or API keys needed
6. Click "Deploy"
7. Once deployed, copy the backend URL (something like https://les-dunes-server.vercel.app)
8. Update the frontend `.env.production` file with this URL as `REACT_APP_API_URL`
9. Redeploy the frontend if needed

## 3. Verifying the Deployment

1. Test the website functionality:
   - Navigate to your deployed frontend URL
   - Test placing orders
   - Confirm you receive email notifications
   
2. Check these important features:
   - Product display
   - Order submission
   - Email notifications
   - Admin authentication with 30-day session
   - Contact information showing the correct phone number (+216 58 678 330)
   - Facebook link pointing to https://www.facebook.com/profile.php?id=61579136484387

## 4. Troubleshooting

If you encounter issues with email notifications:
1. Verify the `BREVO_API_KEY` is correctly set in Vercel backend environment variables
2. Check Vercel function logs for any errors in the backend
3. Make sure the API URL in the frontend points to the correct backend URL
