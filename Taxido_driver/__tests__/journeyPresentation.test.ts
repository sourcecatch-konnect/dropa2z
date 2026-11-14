import {journeyPhase,nextDeliveryAddress,pickupStartedAt,routeEtaLabel,waitClock} from '../src/utils/journeyPresentation';
it('uses confirmed booking status and never animates a cancelled or completed delivery',()=>{
 expect(['searching','accepted','arrived','started','completed','cancelled'].map(journeyPhase)).toEqual(['search','pickup','arrived','trip','inactive','inactive']);
});
it('tracks the next unconfirmed multi-drop instead of always showing the final destination',()=>{
 expect(nextDeliveryAddress({locations:['Pickup','Drop 1','Drop 2'],parcel_delivery_progress:{stops:[{delivered_at:'2026-11-06'},{}]}})).toBe('Drop 2');
 expect(nextDeliveryAddress({locations:['Pickup','Drop 1','Drop 2']})).toBe('Drop 1');
});
it('never invents ETA or waiting time and rejects stale/wrong-phase route estimates',()=>{
 const now=1000000,raw={_routeEta:{phase:'pickup',measuredAt:now,arrivalAt:now+240000}};
 expect(routeEtaLabel(raw,'pickup',now)).toBe('4 min');
 expect(routeEtaLabel(raw,'trip',now)).toBeUndefined();
 expect(routeEtaLabel(raw,'pickup',now+121000)).toBeUndefined();
 expect(routeEtaLabel({},'pickup',now)).toBeUndefined();
 expect(waitClock(undefined,now)).toBe('—');
 expect(waitClock(now-84000,now)).toBe('1:24');
 expect(pickupStartedAt({ride_status:{slug:'accepted'},updated_at:'2026-11-06T10:00:00Z'})).toBeUndefined();
});
