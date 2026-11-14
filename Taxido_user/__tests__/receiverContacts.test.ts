import {receiverContacts} from '../src/utils/receiverContacts';
import {vehicleChoices} from '../src/utils/vehicleChoices';

it('imports names and valid Indian numbers without duplicate or malformed phone entries',()=>{
  expect(receiverContacts([{recordID:'a',givenName:'Receiver',familyName:'Name',phoneNumbers:[{number:'+91 98239 71070'},{number:'9823971070'},{number:'12345'},{number:'abc'}]}])).toEqual([{id:'a:9823971070',name:'Receiver Name',phone:'9823971070',countryCode:'+91'}]);
});
it('only offers the real Bike and standard Auto without a Scooter alias or other variants',()=>{
  const bike={id:15,name:'Bike',charges:{total:75}};
  const options=vehicleChoices([bike]);
  expect(options[0]).toBe(bike);
  expect(options).toHaveLength(1);
  expect(vehicleChoices([{id:16,name:'Auto',charges:{total:90}}])).toHaveLength(1);
  expect(vehicleChoices([{id:17,name:'Scooter',charges:{total:80}}])).toHaveLength(0);
  expect(vehicleChoices([{id:18,name:'Cargo Auto'},{id:19,name:'Electric Rickshaw'},{id:20,name:'Roof rack Auto'}])).toEqual([]);
  const auto={id:21,name:'Auto Rickshaw',charges:{total:90}};
  expect(vehicleChoices([bike,auto])).toEqual([bike,auto]);
});
