export function driverWalletEligible(balance:number,settings:any):boolean {
  const allow=settings?.activation?.allow_negative_balance;
  if(allow===true||allow===1||allow==='1'||allow==='true')return true;
  const minimum=Number(settings?.wallet?.driver_min_wallet_balance??0);
  return Number.isFinite(balance)&&balance>=Math.max(0,Number.isFinite(minimum)?minimum:0);
}
