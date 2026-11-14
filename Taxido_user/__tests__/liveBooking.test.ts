import {activeBookings,bookingClock,bookingDeadline,bookingItems,recentSearchesToShow} from '../src/utils/liveBooking';
const request={id:14,status:'requested',created_at:'2026-11-05T10:00:00Z',ride_number:10014};
it('replaces a searching request with its accepted delivery without duplicate cards',()=>{
  expect(activeBookings([request],[],5)).toEqual([expect.objectContaining({key:'request:14',kind:'request',status:'searching'})]);
  const ride={id:21,ride_status:{slug:'accepted'}};
  const result=activeBookings([{...request,ride_id:21}],[ride],5);
  expect(result).toHaveLength(1);expect(result[0]).toMatchObject({key:'request:14',id:21,kind:'ride',status:'accepted'});
});
it('hides cancelled/completed requests and deliveries and scheduled requests',()=>{
  for(const status of ['cancelled','completed','expired','rejected','no_driver_found']){
    expect(activeBookings([{...request,status}],[{id:21,ride_status:{slug:status}}],5)).toEqual([]);
  }
  expect(activeBookings([{...request,service_category:{service_category_type:'schedule'}}],[],5)).toEqual([]);
});
it('uses the original server deadline, not the time Home or the booking screen opens',()=>{
  const deadline=Date.parse('2026-11-05T10:05:00Z');
  expect(bookingDeadline(request,5)).toBe(deadline);
  expect(bookingDeadline({...request,find_driver_expires_at:'2026-11-05T10:03:00Z'},5)).toBe(deadline-120000);
  expect(bookingClock(deadline,deadline-61000)).toBe('1:01 remaining');
  expect(bookingClock(deadline,deadline+1000)).toBe('Checking availability…');
  expect(bookingDeadline({},NaN)).toBeUndefined();
});
it('distinguishes a confirmed empty list from a failed response',()=>{
  expect(bookingItems({data:[]})).toEqual([]);
  expect(bookingItems({message:'Too many requests'})).toBeNull();
});
it('limits recent searches to two without deleting older saved searches',()=>{
  const recent=[1,2,3,4];expect(recentSearchesToShow(recent,false)).toEqual([1,2]);
  expect(recentSearchesToShow(recent,true)).toEqual(recent);expect(recent).toHaveLength(4);
});
