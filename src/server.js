require("dotenv").config();
console.log("SERVER START TEST_MODE =", process.env.TEST_MODE);

const express = require("express");
const cors = require("cors");
const healthRoute = require("./routes/health.js");
const pasteRoute = require("./routes/paste.js");
const redis = require("./utils/redis.js");

const app = express();

app.set("trust proxy", true);

app.use(cors());
app.use(express.json());

app.use("/api/healthZ", healthRoute);
app.use("/api/pastes", pasteRoute);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pastebin Lite</title>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          textarea { width: 100%; height: 150px; }
          input { margin: 5px 0; width: 300px; }
          button { margin-top: 10px; padding: 8px 12px; }
          #result { margin-top: 15px; }
        </style>
      </head>
      <body>
        <h2>Create a Paste</h2>

        <textarea id="content" placeholder="Enter your text"></textarea><br/>

        <input id="ttl" type="number" placeholder="TTL in seconds (optional)" /><br/>
        <input id="views" type="number" placeholder="Max views (optional)" /><br/>

        <button onclick="createPaste()">Create Paste</button>

        <div id="result"></div>

        <script>
          async function createPaste() {
            const content = document.getElementById("content").value;
            const ttl = document.getElementById("ttl").value;
            const views = document.getElementById("views").value;

            const body = { content };
            if (ttl) body.ttl_seconds = Number(ttl);
            if (views) body.max_views = Number(views);

            const res = await fetch("/api/pastes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
              document.getElementById("result").innerText = data.error;
              return;
            }

            document.getElementById("result").innerHTML =
              'Paste created: <a href="' + data.url + '" target="_blank">' + data.url + '</a>';
          }
        </script>
      </body>
    </html>
  `);
});

app.get("/p/:id", async (req, res) => {
  const { id } = req.params;

  const raw = await redis.get(`paste:${id}`);
  if (!raw) {
    return res.status(404).send("Paste not found");
  }

  const paste = typeof raw === "string" ? JSON.parse(raw) : raw;

  //  View limit check //
  if (paste.max_views !== null) {
    if (paste.views >= paste.max_views) {
      return res.status(404).send("View limit exceeded");
    }
    paste.views += 1;
    await redis.set(`paste:${id}`, JSON.stringify(paste));
  }

  // Escape content (XSS protection)  //
  const escapedContent = paste.content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Paste</title>
        <meta charset="UTF-8" />
        <style>
          body { font-family: monospace; padding: 20px; }
          pre { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <pre>${escapedContent}</pre>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;


if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server Running On PORT ${PORT}`);
  });
}

module.exports = app;
