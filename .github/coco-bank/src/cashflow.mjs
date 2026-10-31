// Each receipt freezes its deadline when issued. Existing payroll dates are preserved.
export const DEFAULT_DUE_DAYS={rent:1,electricity:5,communications:8,water:10,community:12,home_insurance:15,car_loan:15,car_insurance:15,fuel:20,car_maintenance:20,transport:20,food:3,school:7,health:18,health_insurance:18,clothing:22,leisure:25,subscriptions:8,care:18,other_debt:15};
export function readDueDays(input,expenses){
 const days={};for(const id of Object.keys(expenses)){const v=Number(input?.[id]??DEFAULT_DUE_DAYS[id]??15);if(!Number.isInteger(v)||v<1||v>28)throw Error('Elige un día de pago entre el 1 y el 28.');days[id]=v}return days;
}
export function receiptDueAt(at,dueDay){
 const issued=new Date(at),day=Number(dueDay);let y=issued.getUTCFullYear(),m=issued.getUTCMonth();
 // A bill can be paid from issue until the next occurrence of its monthly deadline.
 if(day<issued.getUTCDate())m++;
 return Date.UTC(y,m,day,23,59,59,999);
}
