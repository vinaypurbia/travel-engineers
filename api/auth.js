// In-memory rate limiter. Resets on cold start (serverless), but still stops
// rapid automated guessing within a warm instance — meaningful since a brute
// force attempt is normally thousands of requests in seconds. Not a complete
// substitute for a real WAF, but a real and free improvement over nothing.
const attempts = new Map(); // ip -> { count, firstAttempt }
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 8;

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record) return false;
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count++;
  }
}

function clearAttempts(ip) {
  attempts.delete(ip);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      const ip = getClientIp(req);

      if (isRateLimited(ip)) {
        return res.status(429).json({
          success: false,
          message: "Too many login attempts. Please wait 15 minutes and try again.",
        });
      }

      const { password } = req.body;
      const adminPass = process.env.ADMIN_PASSWORD || "admin123";
      if (password === adminPass) {
        clearAttempts(ip);
        return res.json({ success: true });
      }
      recordFailedAttempt(ip);
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: err.message });
  }
};
