// Historical expense reports use issued receipts, never today's configurable budget.
export function expenseMonthSummary(state,requestedMonth,now){
 const monthOf=t=>new Date(t).toISOString().slice(0,7);
 const bills=state?.bills||[],keys=[...new Set([...(state?.months||[]).map(x=>x.slice(0,7)),...bills.map(b=>monthOf(b.at))])].sort();
 const month=keys.includes(requestedMonth)?requestedMonth:(keys.at(-1)||monthOf(now));
 const receipts=bills.filter(b=>monthOf(b.at)===month),through=bills.filter(b=>monthOf(b.at)<=month);
 const sum=rows=>{const total=rows.reduce((v,b)=>v+b.amount,0),paid=rows.filter(b=>b.paid).reduce((v,b)=>v+b.amount,0);return {total,paid,pending:total-paid,count:rows.length}};
 return {month,months:keys,receipts,current:sum(receipts),cumulative:sum(through),earlierPending:sum(through.filter(b=>monthOf(b.at)<month)).pending};
}
