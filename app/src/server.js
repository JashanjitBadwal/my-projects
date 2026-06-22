const http = require("http");

const PORT = process.env.PORT || 8080;
const REGION = process.env.REGION || "unknown";

let ready = false;
setTimeout(() => { ready = true; }, 3000);

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", region: REGION }));
    return;
  }

  if (req.url === "/readyz") {
    if (ready) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ready", region: REGION }));
    } else {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "not-ready", region: REGION }));
    }
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "hello from multi-region SRE demo", region: REGION }));
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT} in region ${REGION}`);
});
