#!/usr/bin/env node
// Simple dev log server: listens on port 9999 and prints POST bodies to stdout
import http from "http";
const PORT = process.env.DEV_LOG_PORT || 9999;

const server = http.createServer((req, res) => {
  // Basic CORS handling so browser can POST from the frontend
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.url === "/log" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        console.log("[DEV-LOG]", new Date().toISOString());
        if (payload.level) console.log("level:", payload.level);
        if (payload.message) console.log("message:", payload.message);
        if (payload.context)
          console.log("context:", JSON.stringify(payload.context, null, 2));
      } catch (err) {
        console.log("[DEV-LOG] Received non-JSON or parse error:", err.message);
        console.log(body);
      }
      res.writeHead(204, corsHeaders);
      res.end();
    });
    return;
  }

  if (req.url === "/log" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain", ...corsHeaders });
    res.end("dev-log-server: OK");
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain", ...corsHeaders });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`[dev-log-server] Listening on http://localhost:${PORT}/log`);
});
