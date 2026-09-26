export const COLLECTED_STATUSES = new Set(["collected","paid","تم التحصيل","محصل","محصلة","تحصيل"]);
export const CANCELLED_STATUSES = new Set(["cancelled","canceled","ملغى","ملغاة"]);

export function countsAsCollected(row:{status?:string|null;collection_date?:string|null}) {
  const status=String(row.status||"").trim().toLowerCase();
  const date=String(row.collection_date||"").trim();
  return !CANCELLED_STATUSES.has(status) && (COLLECTED_STATUSES.has(status) || date!=="");
}

export function collectedAmount(rows:Array<{status?:string|null;collection_date?:string|null;amount?:number|string|null}>) {
  return rows.filter(countsAsCollected).reduce((sum,row)=>sum+Number(row.amount||0),0);
}

export function cappedCollectedAmount(contractValue:number, rows:Array<{status?:string|null;collection_date?:string|null;amount?:number|string|null}>) {
  return Math.min(Math.max(collectedAmount(rows),0), Math.max(Number(contractValue||0),0));
}

export function remainingAmount(contractValue:number, rows:Array<{status?:string|null;collection_date?:string|null;amount?:number|string|null}>) {
  return Math.max(Number(contractValue||0)-cappedCollectedAmount(contractValue,rows),0);
}
