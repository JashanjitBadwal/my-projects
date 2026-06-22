import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8080"))
REGION = os.environ.get("REGION", "unknown")

# Simulates real startup latency (e.g. config/cache warm-up) so the
# readiness probe has something meaningful to gate on, separate from
# liveness — k8s won't route traffic here until /readyz flips.
ready = False


def _mark_ready():
    global ready
    time.sleep(3)
    ready = True


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        # Liveness target: always healthy once the process is up. This is
        # also what the Route53 health check in terraform/modules/route53
        # probes for region-level failover, so it intentionally ignores app
        # readiness.
        if self.path == "/healthz":
            self._send_json(200, {"status": "ok", "region": REGION})
            return

        if self.path == "/readyz":
            if ready:
                self._send_json(200, {"status": "ready", "region": REGION})
            else:
                self._send_json(503, {"status": "not-ready", "region": REGION})
            return

        self._send_json(
            200,
            {"message": "hello from multi-region SRE demo", "region": REGION},
        )

    # Silence the default request logging to stderr on every hit; keep only
    # the startup line below.
    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    threading.Thread(target=_mark_ready, daemon=True).start()

    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"listening on {PORT} in region {REGION}")
    server.serve_forever()
