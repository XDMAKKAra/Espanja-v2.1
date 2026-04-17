export default function handler(req, res) {
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    envKeys: Object.keys(process.env).filter(k => !k.startsWith("__") && !k.startsWith("AWS")).sort()
  });
}
