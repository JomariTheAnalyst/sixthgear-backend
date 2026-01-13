# Cloudflare R2 File Storage Setup Guide

## Overview

This guide explains how to configure Cloudflare R2 as the file storage provider for Medusa.

## Prerequisites

- Cloudflare account with R2 enabled
- R2 bucket created
- R2 API token with read/write permissions

## Step 1: Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Click "Create bucket"
3. Name: `sixthgear-media`
4. Location: Choose closest to your users (e.g., APAC for Philippines)

## Step 2: Enable Public Access

1. Go to your bucket settings
2. Under "Public access", click "Allow Access"
3. You'll get a public URL like: `https://pub-xxxxx.r2.dev`
4. Or configure a custom domain (recommended)

### Custom Domain Setup (Optional)

1. Go to bucket settings → "Custom Domains"
2. Add domain: `cdn.sixthgearmoto.com`
3. Configure DNS in Cloudflare:
   - Type: CNAME
   - Name: cdn
   - Target: Your R2 public hostname

## Step 3: Create API Token

1. Go to R2 → "Manage R2 API Tokens"
2. Click "Create API token"
3. Permissions: "Object Read & Write"
4. Specify bucket: `sixthgear-media`
5. Save the Access Key ID and Secret Access Key

## Step 4: Configure Environment Variables

Add to your `.env` file:

```env
# Cloudflare R2 Storage
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_REGION=auto
S3_BUCKET=sixthgear-media
S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
S3_FILE_URL=https://cdn.sixthgearmoto.com
```

**Finding your Account ID:**

- Go to Cloudflare Dashboard → R2
- Your Account ID is in the URL or sidebar

## Step 5: Configure CORS

Apply CORS configuration to your R2 bucket:

```bash
# Using wrangler CLI
wrangler r2 bucket cors put sixthgear-media --rules ./r2-cors-config.json
```

Or manually in Cloudflare Dashboard:

1. Go to R2 → Your bucket → Settings
2. Add CORS rules from `r2-cors-config.json`

## Step 6: Install Dependencies

```bash
cd sixthgear-backend
npm install
# or
yarn install
```

## Step 7: Restart Medusa

```bash
npm run dev
```

## Testing

### 1. Upload Test via Admin

1. Open Medusa Admin (http://localhost:9000)
2. Go to Products → Create/Edit Product
3. Upload an image
4. Check the image URL in browser dev tools

### 2. Verify in R2

1. Go to Cloudflare Dashboard → R2 → Your bucket
2. Navigate to `uploads/products/`
3. Confirm file exists

### 3. Check Database

```sql
SELECT * FROM image WHERE url LIKE '%r2%' OR url LIKE '%cdn.sixthgearmoto%';
```

### 4. Test Public Access

Copy the image URL and open in incognito browser - should load without authentication.

## File Organization

Files are organized as:

```
uploads/
  products/
    1704067200000-a1b2c3d4-product-image.jpg
    1704067300000-e5f6g7h8-another-image.png
  private/
    (for private files if needed)
```

## Troubleshooting

### "Access Denied" Error

- Check API token permissions
- Verify bucket name matches
- Ensure endpoint URL is correct

### CORS Errors

- Apply CORS configuration to bucket
- Add your domains to AllowedOrigins
- Clear browser cache

### Images Not Loading

- Check S3_FILE_URL is correct
- Verify public access is enabled on bucket
- Test URL directly in browser

### Upload Fails

- Check file size (max 5MB)
- Verify file type is allowed (jpg, png, webp, gif)
- Check Medusa logs for detailed error

## Environment Variables Reference

| Variable             | Description       | Example                                |
| -------------------- | ----------------- | -------------------------------------- |
| S3_ACCESS_KEY_ID     | R2 API Access Key | `abc123...`                            |
| S3_SECRET_ACCESS_KEY | R2 API Secret Key | `xyz789...`                            |
| S3_REGION            | R2 Region         | `auto`                                 |
| S3_BUCKET            | Bucket name       | `sixthgear-media`                      |
| S3_ENDPOINT          | R2 API endpoint   | `https://xxx.r2.cloudflarestorage.com` |
| S3_FILE_URL          | Public URL base   | `https://cdn.sixthgearmoto.com`        |

## Security Notes

- Never commit `.env` file to git
- Use separate buckets for dev/staging/production
- Rotate API tokens periodically
- Monitor R2 usage in Cloudflare dashboard
