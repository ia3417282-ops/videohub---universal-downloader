# VideoHub Pro 🚀

Professional, high-performance video downloader for all major platforms. Built with a focus on speed, quality, and user privacy.

## ✨ Features

- **Multi-Platform Support**: Download from YouTube, TikTok, Instagram, Facebook, Twitter (X), and more.
- **High Quality**: Extract original quality up to 4K/1080p.
- **Audio Extraction**: Convert any video to high-quality MP3.
- **Batch Download**: Download all available formats in a single compressed ZIP file.
- **Local History**: Your download history is stored locally on your device (IndexedDB) for total privacy.
- **PWA Ready**: Install it on your phone or desktop for a native app experience.
- **Responsive Design**: Optimized for Mobile, Tablet, and Desktop.
- **Modern UI**: Clean, dark-themed interface with smooth animations.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion.
- **Backend**: Node.js, Express, Axios.
- **Storage**: IndexedDB (Client-side).
- **Compression**: JSZip.

## 🚀 Deployment

### Vercel / Netlify
This project is structured as a unified Express + Vite application. To deploy:
1. Connect your GitHub repository to Vercel/Netlify.
2. Set the **Build Command** to `npm run build`.
3. Set the **Output Directory** to `dist`.
4. The `server.ts` will handle both API requests and static file serving.

### Self-Hosted
1. Clone the repository.
2. Run `npm install`.
3. Run `npm run build`.
4. Start the server: `npm start`.

## 📝 License

© 2026 VideoHub Pro - All Rights Reserved. Developed by VideoHub Team.
