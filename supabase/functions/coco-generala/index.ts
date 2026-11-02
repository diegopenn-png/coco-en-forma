import {createClient} from 'npm:@supabase/supabase-js@2.112.3';
import {createHandler} from './handler.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
// Every action verifies the incoming user with Auth; the service role is server-only.
Deno.serve(createHandler({db,auth:db.auth}));
