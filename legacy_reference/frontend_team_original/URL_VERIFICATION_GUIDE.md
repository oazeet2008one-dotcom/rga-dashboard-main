# URL Verification Guide

This guide explains how to verify your Terms of Service URL for various services.

## ✅ What's Already Set Up

1. **Meta Tags**: The Terms of Service page (`/terms`) now includes proper SEO and verification meta tags
2. **robots.txt**: Created to allow search engines and verification bots to access the page
3. **Canonical URLs**: Proper canonical URLs are set for SEO
4. **Open Graph Tags**: Social media sharing tags are configured

## 🔐 Adding Verification Codes

When a service provides you with a verification code, add it to the Terms of Service component:

### Location
`frontend/src/components/legal/TermsOfService.tsx`

### Common Verification Methods

#### 1. Meta Tag Verification
Uncomment and update the appropriate meta tag in the `<Helmet>` section:

```tsx
{/* For general verification */}
<meta name="verification" content="your-verification-code-here" />

{/* For Google verification */}
<meta name="google-site-verification" content="your-google-verification-code" />

{/* For Facebook verification */}
<meta name="facebook-domain-verification" content="your-facebook-verification-code" />

{/* For TikTok verification */}
<meta name="tiktok-verification" content="your-tiktok-verification-code" />
```

#### 2. File-Based Verification
Some services require placing a verification file. If needed:

1. Create the file in `frontend/public/.well-known/` directory
2. Add the verification content provided by the service
3. The file will be accessible at `https://rga-dashboard.vercel.app/.well-known/[filename]`

#### 3. DNS Verification
If DNS verification is required, add a TXT record to your domain's DNS settings (not handled in code).

## 📋 Verification Checklist

- [x] Terms of Service page is accessible at `/terms`
- [x] Meta tags are properly configured
- [x] robots.txt allows access to `/terms`
- [x] Canonical URL is set correctly
- [ ] Verification meta tag added (when code is provided)
- [ ] Verification file created (if required)
- [ ] DNS TXT record added (if required)

## 🧪 Testing URL Verification

1. **Check Accessibility**:
   ```bash
   curl -I https://rga-dashboard.vercel.app/terms
   ```
   Should return `200 OK`

2. **Check Meta Tags**:
   Visit the page and view source, or use:
   ```bash
   curl https://rga-dashboard.vercel.app/terms | grep -i "meta name"
   ```

3. **Verify robots.txt**:
   ```bash
   curl https://rga-dashboard.vercel.app/robots.txt
   ```

## 🚀 After Adding Verification

1. Rebuild and deploy your frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Vercel (or your hosting platform)

3. Wait a few minutes for changes to propagate

4. Click "Verify" in the service's dashboard

## 📝 Notes

- The verification meta tags are commented out by default
- Uncomment and add your verification code when provided
- Some services may take a few minutes to verify after deployment
- Make sure your site is publicly accessible (not behind authentication)

## 🔗 Related Files

- Terms of Service Component: `frontend/src/components/legal/TermsOfService.tsx`
- robots.txt: `frontend/public/robots.txt`
- index.html: `frontend/public/index.html`

