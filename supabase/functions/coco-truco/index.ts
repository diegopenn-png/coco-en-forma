import {createClient} from 'npm:@supabase/supabase-js@2.112.3';
import {makeHandler} from './handler.mjs';
// Access is a per-seat capability. Only its salted, room-specific digest is stored.
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db=createClient(Deno.env.get('SUPABASE_URL')!,secret,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(makeHandler(db,secret));
