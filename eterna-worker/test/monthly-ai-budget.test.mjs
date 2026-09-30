import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const workerUrl=new URL("../src/index.js",import.meta.url);
const wranglerUrl=new URL("../wrangler.jsonc",import.meta.url);
const sqlUrl=new URL("../../supabase-eterna-v160100-monthly-ai-budget.sql",import.meta.url);
const uiUrl=new URL("../../eterna-v159.js",import.meta.url);

test("monthly AI budget is a hard per-user €2 cap",async()=>{
  const [worker,wrangler,sql,ui]=await Promise.all([
    readFile(workerUrl,"utf8"),
    readFile(wranglerUrl,"utf8"),
    readFile(sqlUrl,"utf8"),
    readFile(uiUrl,"utf8")
  ]);

  assert.match(wrangler,/"AI_MONTHLY_BUDGET_EUR":\s*"2\.00"/);
  assert.match(worker,/ETERNA_MONTHLY_AI_BUDGET_REACHED/);
  assert.match(worker,/env=withAiMonthlyBudget\(env,uid\)/);
  assert.match(worker,/reserveAiMonthlyBudget\(env,uid,model,payload\)/);
  assert.match(worker,/settleAiMonthlyBudget\(env,uid,reservation,model/);
  assert.match(worker,/bypass_for_owner_or_tester:false/);

  assert.match(sql,/primary key \(user_id, month_start\)/i);
  assert.match(sql,/for update;/i);
  assert.match(sql,/spent_eur \+ v_row\.reserved_eur \+ v_reserve > v_row\.cap_eur/i);
  assert.match(sql,/revoke all on function public\.eterna_ai_budget_reserve[\s\S]*authenticated/i);
  assert.match(sql,/grant execute on function public\.eterna_ai_budget_reserve[\s\S]*to service_role/i);

  assert.match(ui,/ETERNA_MONTHLY_AI_BUDGET_REACHED/);
});

test("monthly budget uses a fresh row for every natural month",async()=>{
  const worker=await readFile(workerUrl,"utf8");
  assert.match(worker,/day\.slice\(0,7\)\+"-01"/);
  assert.match(worker,/setUTCMonth\(d\.getUTCMonth\(\)\+1\)/);
});

test("budget denial cannot fall through Cloudflare to OpenAI",async()=>{
  const worker=await readFile(workerUrl,"utf8");
  assert.match(worker,/catch\(error\)\{if\(isAiMonthlyBudgetError\(error\)\)throw error;if\(!openaiFallbackEnabled\(env\)\)throw error;/);
});
