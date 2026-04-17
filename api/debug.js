export default function handler(req, res) {
  res.json({
    projectName: process.env.VERCEL_PROJECT_NAME,
    projectId: process.env.VERCEL_PROJECT_ID,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    envCount: Object.keys(process.env).length
  });
}
