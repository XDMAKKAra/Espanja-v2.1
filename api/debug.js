export default function handler(req, res) {
  res.json({
    projectName: process.env.VERCEL_PROJECT_NAME,
    targetEnv: process.env.VERCEL_TARGET_ENV,
    testVar: process.env.TEST_VAR || "NOT SET",
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    envCount: Object.keys(process.env).length
  });
}
