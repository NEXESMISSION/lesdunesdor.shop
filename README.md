# Les Dunes d'Or - E-commerce Website

## Overview
Les Dunes d'Or is a modern e-commerce website built with React, featuring a responsive design, product catalog, shopping cart, and admin dashboard.

## Features
- Responsive design for mobile and desktop
- Product catalog with categories and filters
- Admin dashboard for managing products, orders, and categories
- User authentication for admin access
- Real-time updates using Supabase

## Tech Stack
- React
- React Router
- Tailwind CSS
- Supabase (Backend as a Service)
- Font Awesome (Icons)

## Deployment Instructions

### Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Set up the following environment variables in Vercel:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
3. Deploy using the Vercel dashboard

### Manual Deployment

1. Clone the repository:
   ```
   git clone https://github.com/NEXESMISSION/lesdunesdor.shop.git
   cd lesdunesdor.shop
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Build the project:
   ```
   npm run build
   ```

5. Deploy the `build` folder to your hosting provider

## Development

1. Clone the repository:
   ```
   git clone https://github.com/NEXESMISSION/lesdunesdor.shop.git
   cd lesdunesdor.shop
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## License
All rights reserved.
