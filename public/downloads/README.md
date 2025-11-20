# Focus Time - App Download Files

This directory contains the downloadable app files for Focus Time.

## How to Add Your Built App Files

### For macOS (.dmg)

1. Build your Focus Time app for macOS using Tauri:
   ```bash
   cd path/to/focus-time
   pnpm run build
   ```

2. Find the generated `.dmg` file in:
   ```
   focus-time/src-tauri/target/release/bundle/dmg/
   ```

3. Copy the `.dmg` file to this directory:
   ```bash
   cp focus-time/src-tauri/target/release/bundle/dmg/Focus\ Time_*.dmg \
      /Users/camilomartinez/github/1-camilomartinez-portfolio/public/downloads/focus-time-macos.dmg
   ```

### For Windows (.exe or .msi)

1. Build your Focus Time app for Windows using Tauri:
   ```bash
   cd path/to/focus-time
   pnpm run build
   ```

2. Find the generated installer in:
   ```
   focus-time/src-tauri/target/release/bundle/msi/ (for .msi)
   focus-time/src-tauri/target/release/bundle/nsis/ (for .exe)
   ```

3. Copy the installer to this directory:
   ```bash
   cp focus-time/src-tauri/target/release/bundle/nsis/Focus\ Time_*.exe \
      /Users/camilomartinez/github/1-camilomartinez-portfolio/public/downloads/focus-time-windows.exe
   ```

## File Size Considerations

- `.dmg` files are typically 5-15 MB for Tauri apps
- `.exe` installers are typically 4-12 MB
- If file sizes exceed GitHub's 100 MB limit, consider:
  - Using Git LFS (Large File Storage)
  - Hosting on external CDN (Cloudflare R2, AWS S3, etc.)
  - Using GitHub Releases for downloads

## Using GitHub Releases (Recommended)

Instead of committing large binaries to your repo, use GitHub Releases:

1. Build your app binaries
2. Create a new release on GitHub:
   ```bash
   gh release create v1.0.0 \
     focus-time-macos.dmg \
     focus-time-windows.exe \
     --title "Focus Time v1.0.0" \
     --notes "Initial release"
   ```

3. Update the download links in `/src/app/(main)/apps/focus-time/page.tsx`:
   ```tsx
   href="https://github.com/yourusername/focus-time/releases/download/v1.0.0/focus-time-macos.dmg"
   ```

## Hosting on CDN (Alternative)

For better performance and to avoid GitHub bandwidth limits:

### Cloudflare R2 (Free tier: 10GB storage, 10M requests/month)
1. Create R2 bucket
2. Upload files: `focus-time-macos.dmg`, `focus-time-windows.exe`
3. Make bucket public or use signed URLs
4. Update download links to: `https://your-bucket.r2.cloudflarestorage.com/focus-time-macos.dmg`

### AWS S3 + CloudFront
1. Create S3 bucket
2. Upload files
3. Create CloudFront distribution
4. Update download links to CloudFront URL

## Auto-Updates with Tauri

Consider implementing auto-updates using Tauri's updater:
- https://tauri.app/v1/guides/distribution/updater/

This allows the app to check for and install updates automatically.

## Security

- Code sign your macOS app: https://tauri.app/v1/guides/building/macos
- Sign your Windows app with a certificate: https://tauri.app/v1/guides/building/windows

Unsigned apps will trigger security warnings on user machines.

## Current Status

- [ ] macOS `.dmg` file added
- [ ] Windows `.exe` file added
- [ ] GitHub Release created
- [ ] Download links updated in page.tsx
- [ ] Apps code-signed

---

**Next Steps:**
1. Build your Focus Time app
2. Copy the built files here OR create a GitHub Release
3. Update the download URLs in the download page component
4. Test downloads on both platforms
