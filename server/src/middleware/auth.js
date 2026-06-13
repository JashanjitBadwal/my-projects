import jwt from 'jsonwebtoken';

// Express middleware that requires a valid JWT in the Authorization header.
// On success, attaches the decoded user info to req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  // Expect a header of the form "Authorization: Bearer <token>".
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email, name: payload.name };
    next();
  } catch (err) {
    // Token is missing, malformed, expired, or signed with a different secret.
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
