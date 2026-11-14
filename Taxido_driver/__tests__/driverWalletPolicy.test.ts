import {driverWalletEligible} from '../src/utils/driverWalletPolicy';
it.each([true,1,'1','true'])('keeps a cash driver eligible after fees when negative balance is enabled: %p',allow=>{
 const settings={activation:{allow_negative_balance:allow},wallet:{driver_min_wallet_balance:0}};
 expect(driverWalletEligible(0,settings)).toBe(true);expect(driverWalletEligible(-29.11,settings)).toBe(true);
});
it.each([false,0,'0',undefined])('enforces minimum and zero floor when negative balances are disabled: %p',allow=>{
 const settings={activation:{allow_negative_balance:allow},wallet:{driver_min_wallet_balance:10}};
 expect(driverWalletEligible(-29.11,settings)).toBe(false);expect(driverWalletEligible(0,settings)).toBe(false);expect(driverWalletEligible(10,settings)).toBe(true);
});
