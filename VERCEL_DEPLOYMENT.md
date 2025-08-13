# Vercel Deployment Guide for DhanSetu

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a cloud database at [mongodb.com/atlas](https://www.mongodb.com/atlas)
3. **GitHub Repository**: Push your code to GitHub
4. **Environment Variables**: Prepare all required environment variables

## Step 1: Prepare MongoDB Atlas

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get your connection string

## Step 2: Environment Variables for Vercel

In your Vercel dashboard, add these environment variables:

### Required Variables:
- `NODE_ENV` = `production`
- `MONGODB_URI` = Your MongoDB Atlas connection string
- `JWT_SECRET` = A secure random string (32+ characters)
- `FRONTEND_URL` = Your Vercel app URL (e.g., `https://dhan-setu.vercel.app`)

### API Keys:
- `ETHEREUM_RPC_URL` = Your Infura or Alchemy endpoint
- `POLYGON_RPC_URL` = `https://polygon-rpc.com`
- `RAZORPAY_KEY_ID` = Your RazorPay key ID
- `RAZORPAY_KEY_SECRET` = Your RazorPay key secret
- `GOOGLE_CLIENT_ID` = Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` = Your Google OAuth client secret

### Email Configuration:
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER` = Your Gmail address
- `SMTP_PASS` = Your Gmail app password

### Security:
- `WEBHOOK_SECRET` = A secure random string
- `SESSION_SECRET` = A secure random string
- `BCRYPT_ROUNDS` = `12`

## Step 3: Deploy to Vercel

### Option 1: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: Using GitHub Integration
1. Connect your GitHub repository to Vercel
2. Import your project
3. Configure environment variables
4. Deploy

## Step 4: Configure Build Settings

In your Vercel project settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave empty for root)
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `npm install`

## Step 5: Domain Configuration

1. Add your custom domain in Vercel dashboard
2. Update `FRONTEND_URL` environment variable to your domain
3. Configure DNS settings as instructed by Vercel

## Step 6: Testing Deployment

After deployment, test these endpoints:

- `https://your-app.vercel.app/` - Frontend homepage
- `https://your-app.vercel.app/api/health` - Backend health check
- `https://your-app.vercel.app/api/chains` - API functionality

## Deployment Structure

```
your-app.vercel.app/
├── /                    → Frontend (Next.js)
├── /api/*              → Backend API (Serverless functions)
├── /dashboard          → Merchant dashboard
├── /pay/[id]          → Payment pages
└── /api-docs          → API documentation
```

## Important Notes

1. **Cold Starts**: Serverless functions may have cold start delays
2. **Timeout Limits**: Vercel has execution time limits (30s max)
3. **Database Connections**: Use connection pooling for MongoDB
4. **File Uploads**: Use cloud storage (AWS S3, Cloudinary) instead of local storage
5. **Logging**: Use Vercel's built-in logging or external services like Sentry

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check dependencies in root package.json
2. **API Errors**: Verify environment variables are set correctly
3. **Database Connection**: Ensure MongoDB Atlas allows connections from all IPs
4. **CORS Issues**: Update CORS configuration for your domain

### Debugging:
- Use Vercel's function logs
- Check browser console for frontend errors
- Test API endpoints individually

## Production Optimizations

1. **Enable Caching**: Configure proper cache headers
2. **Image Optimization**: Use Vercel's image optimization
3. **Analytics**: Add Vercel Analytics
4. **Monitoring**: Set up error tracking with Sentry
5. **Performance**: Monitor Core Web Vitals

## Security Considerations

1. **Environment Variables**: Never commit secrets to repository
2. **CORS**: Configure strict CORS policies
3. **Rate Limiting**: Implement proper rate limiting
4. **Input Validation**: Validate all API inputs
5. **Authentication**: Use secure JWT tokens

## Maintenance

1. **Updates**: Regularly update dependencies
2. **Monitoring**: Monitor application performance
3. **Backups**: Regular database backups
4. **Security**: Regular security audits
5. **Logs**: Monitor application logs

That's it! Your DhanSetu Payment Gateway should now be deployed and running on Vercel.
