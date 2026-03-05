import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";
import JSZip from "jszip";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route: Analyze Video URL (Real Extraction with Fallbacks)
  app.post("/api/analyze", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "الرابط مطلوب" });

    // List of public Cobalt instances to try in order
    const instances = [
      "https://api.cobalt.tools/api/json",
      "https://cobalt.tools/api/json",
      "https://cobalt-api.v0.sh/api/json",
      "https://api.kome.ai/api/v1/downloader",
      "https://cobalt.api.unblocked.lol/api/json"
    ];

    let lastError = null;

    for (const instance of instances) {
      try {
        console.log(`Trying extraction from: ${instance}`);
        
        const isKome = instance.includes("kome.ai");
        const payload = isKome ? { url } : {
          url: url,
          videoQuality: "720", // Safer default
          audioFormat: "mp3",
          filenameStyle: "pretty",
          downloadMode: "auto"
        };

        const response = await axios.post(instance, payload, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          timeout: 15000 // 15 seconds timeout
        });

        const data = response.data;

        // Handle Cobalt response
        if (!isKome) {
          if (data.status === "error") {
            console.warn(`Cobalt error from ${instance}:`, data.text);
            lastError = data.text || "فشل استخراج الفيديو من هذا الخادم.";
            continue; // Try next instance
          }

          let videoInfo;
          const urlObj = new URL(url);
          let title = data.filename || "Video " + new Date().toLocaleDateString();
          let thumbnail = `https://picsum.photos/seed/${Math.random()}/800/450`;

          if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const videoId = url.includes("youtu.be") ? urlObj.pathname.slice(1) : urlObj.searchParams.get("v");
            if (videoId) thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }

          if (data.status === "stream" || data.status === "redirect") {
            videoInfo = {
              title,
              thumbnail,
              duration: "N/A",
              source: url,
              formats: [{ quality: "Original Quality", format: "mp4", size: "Auto", url: data.url, type: "video" }]
            };
          } else if (data.status === "picker") {
            videoInfo = {
              title,
              thumbnail,
              duration: "N/A",
              source: url,
              formats: data.picker.map((item: any) => ({
                quality: item.type === "video" ? (item.quality || "HD") : "Audio",
                format: item.ext || (item.type === "audio" ? "mp3" : "mp4"),
                size: "Auto",
                url: item.url,
                type: item.type
              }))
            };
          } else {
            continue; // Unknown status, try next
          }

          return res.json(videoInfo);
        } 
        
        // Handle Kome.ai response (if applicable)
        if (isKome && data.success) {
          return res.json({
            title: data.data.title || "Video",
            thumbnail: data.data.thumbnail || `https://picsum.photos/seed/${Math.random()}/800/450`,
            duration: "N/A",
            source: url,
            formats: [{ quality: "HD", format: "mp4", size: "Auto", url: data.data.url, type: "video" }]
          });
        }

      } catch (error: any) {
        console.error(`Error from ${instance}:`, error.message);
        lastError = error.response?.data?.text || error.message;
      }
    }

    // If all instances fail
    res.status(500).json({ 
      error: "جميع خوادم التحميل مشغولة حالياً أو الرابط غير مدعوم.",
      details: lastError 
    });
  });

  // API Route: ZIP Download
  app.post("/api/download-zip", async (req, res) => {
    const { files } = req.body; // Array of { url, filename }
    if (!files || !Array.isArray(files)) return res.status(400).send("Files array is required");

    try {
      const zip = new JSZip();
      
      for (const file of files) {
        const response = await axios.get(file.url, { responseType: 'arraybuffer' });
        zip.file(file.filename, response.data);
      }

      const content = await zip.generateAsync({ type: "nodebuffer" });
      
      res.setHeader("Content-Disposition", `attachment; filename="videohub_bundle_${Date.now()}.zip"`);
      res.setHeader("Content-Type", "application/zip");
      res.send(content);
    } catch (error) {
      console.error("ZIP error:", error);
      res.status(500).send("Failed to create ZIP");
    }
  });

  // API Route: Proxy Download
  app.get("/api/download", async (req, res) => {
    const { url, filename } = req.query;
    if (!url) return res.status(400).send("URL is required");

    try {
      const response = await axios({
        method: "get",
        url: url as string,
        responseType: "stream",
      });

      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename as string || "video.mp4")}"`);
      response.data.pipe(res);
    } catch (error) {
      res.status(500).send("Failed to download file");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
