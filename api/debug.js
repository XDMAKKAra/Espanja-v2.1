// This endpoint previously leaked env-var reconnaissance data.
// It is no longer routed (see vercel.json) and the handler now
// refuses requests. Delete this file on next deploy if nothing
// depends on its presence.
export default function handler(req, res) {
  res.status(404).json({ error: "Not found" });
}
