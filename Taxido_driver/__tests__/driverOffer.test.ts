import {offerAvailable,offerDeadline,offerMoney} from '../src/utils/driverOffer';
it('uses the driver-specific acceptance window before the overall search window',()=>{
 const offer={id:9,driver_acceptance_expires_at:'2026-11-06T10:00:30Z',find_driver_expires_at:'2026-11-06T10:03:00Z'};
 expect(offerDeadline(offer)).toBe(Date.parse('2026-11-06T10:00:30Z'));
 expect(offerAvailable(offer,Date.parse('2026-11-06T10:00:29Z'))).toBe(true);
 expect(offerAvailable(offer,Date.parse('2026-11-06T10:00:30Z'))).toBe(false);
});
it('excludes assigned, cancelled and expired offers without creating a new local timeout',()=>{
 expect(offerDeadline({id:1})).toBeUndefined();expect(offerAvailable({id:1})).toBe(true);
 for(const status of ['accepted','cancelled','expired','rejected','completed'])expect(offerAvailable({id:1,status})).toBe(false);
 expect(offerAvailable({id:1,ride_id:5})).toBe(false);
});
it('shows the server driver earnings and labels a total-only fallback as booking fare',()=>{
 expect(offerMoney({driver_commission:'42.15',total:50})).toEqual({label:'Est. earnings',amount:42.15});
 expect(offerMoney({total:50})).toEqual({label:'Booking fare',amount:50});
 expect(offerMoney({driver_commission:0,total:50}).amount).toBe(0);
 expect(offerMoney({})).toEqual({label:'Booking fare',amount:undefined});
});
