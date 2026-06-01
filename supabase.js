// Compat re-export shim. The real clients live in lib/supabase.js.
//
// Historical context: this file used to create its own service-role
// client via createClient(...). v266 moved that creation into
// lib/supabase.js (alongside the new createUserClient factory). To
// avoid touching ~26 import sites + ~18 test mock paths in a single
// commit, this file now re-exports lib/supabase.js's clients so
// existing `import supabase from "../supabase.js"` callers keep
// working. The default export is the adminClient; named exports
// (adminClient, createUserClient) are also forwarded for files that
// want to be explicit.

export { adminClient as default, adminClient, authClient, createUserClient } from "./lib/supabase.js";
