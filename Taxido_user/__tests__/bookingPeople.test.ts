import {bookingSnapshot, mergeBookingSnapshot, contactPhone, bookingStatus, parcelReceiver} from '../src/utils/bookingPeople';

it('uses fresh details for the same booking while retaining fields omitted by a partial update', () => {
  const base = {id:10,driver:{id:4,name:'Driver'},ride_status:{slug:'accepted'}};
  const result = mergeBookingSnapshot(base,{data:{data:{id:10,driver:{id:4,phone:'9823971070'},vehicle_model:'Auto'}}});
  expect(result.driver).toEqual({id:4,name:'Driver',phone:'9823971070'});
  expect(result.vehicle_model).toBe('Auto');
  expect(bookingStatus(result)).toBe('accepted');
});
it('never displays another booking from the shared Redux cache', () => {
  const ride = {id:10,driver:{id:4,name:'Assigned Driver'}};
  expect(mergeBookingSnapshot(ride,{id:11,driver:{id:5,name:'Other Driver'}})).toBe(ride);
});
it('never attaches the previous driver details to a newly assigned driver', () => {
  const result = mergeBookingSnapshot({id:10,driver:{id:4,name:'Previous Driver',phone:'9823971070'}}, {id:10,driver:{id:5}});
  expect(result.driver).toEqual({id:5});
});
it('does not replace a newer assignment with an older cached response', () => {
  const current = {id:10,updated_at:'2026-11-04T12:00:00Z',driver:{id:5}};
  expect(mergeBookingSnapshot(current,{id:10,updated_at:'2026-11-04T11:00:00Z',driver:{id:4}})).toBe(current);
});
it.each([
  [{phone:'9823971070',country_code:'91'},'+919823971070'],
  [{phone:'+91 98239 71070'},'+919823971070'],
  [{phone:'undefined'},''],
  [{phone:'tel:123'},''],
  [{phone:null},''],
])('builds safe dialler contacts %#', (person, expected) => expect(contactPhone(person)).toBe(expected));
it('reads the recorded parcel receiver without inventing contact data', () => {
  expect(parcelReceiver({parcel_receiver:'{"name":"Receiver","phone":"9823971070"}'}).name).toBe('Receiver');
  expect(parcelReceiver({parcel_receiver:'bad json'})).toBeNull();
  expect(bookingSnapshot({data:{id:1}}).id).toBe(1);
});
