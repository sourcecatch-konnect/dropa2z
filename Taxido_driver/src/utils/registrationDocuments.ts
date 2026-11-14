export function documentItems(payload:any):any[] {
  if(Array.isArray(payload))return payload;
  if(Array.isArray(payload?.data))return payload.data;
  if(Array.isArray(payload?.data?.data))return payload.data.data;
  throw new Error('Could not load registration documents. Please try again.');
}

export function registrationDocumentWarnings(definitions:any[],uploads:Record<string,any>,expiries:Record<string,any>) {
  const warnings:Record<string,boolean>={};
  definitions.forEach(doc=>{
    const file=uploads[doc.slug];
    if((Number(doc.is_required)===1&&!file)||(file&&Number(doc.need_expired_date)===1&&!expiries[doc.slug]))warnings[doc.slug]=true;
  });
  return warnings;
}
