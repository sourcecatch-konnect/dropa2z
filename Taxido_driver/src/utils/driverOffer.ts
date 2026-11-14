export function offerDeadline(offer:any):number|undefined {
  const values=[offer?.driver_acceptance_expires_at,offer?.find_driver_expires_at,offer?.expires_at].map(v=>Date.parse(v||'')).filter(Number.isFinite);
  return values.length?Math.min(...values):undefined;
}
export function offerAvailable(offer:any,now=Date.now()):boolean {
  if(!offer?.id||offer?.ride_id)return false;
  const status=String(offer?.status?.slug??offer?.status??'').toLowerCase();
  if(['accepted','cancelled','canceled','completed','expired','rejected','no_driver_found'].includes(status))return false;
  const deadline=offerDeadline(offer);
  return deadline===undefined||deadline>now;
}
export function offerMoney(offer:any):{label:string;amount?:number} {
  for(const key of ['estimated_earnings','driver_earnings','driver_commission']){
    const value=offer?.[key];if(value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0)return {label:'Est. earnings',amount:Number(value)};
  }
  const total=offer?.total;
  return {label:'Booking fare',amount:total!==null&&total!==undefined&&total!==''&&Number.isFinite(Number(total))?Number(total):undefined};
}
