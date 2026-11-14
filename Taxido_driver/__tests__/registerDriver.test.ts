import {registerDriver} from '../src/utils/registerDriver';
jest.mock('../src/api/config',()=>({URL:'https://example.invalid'}));

const account={name:'Practice Driver',email:'example@example.invalid',verifiedChannel:'email',verificationToken:'verified-proof'};
const vehicle={serviceName:7,serviceCategory:43,vehicleType:16,vehicleName:'Auto',vehicleNumber:'MH19AB1234',vehicleColor:'Black',maximumSeats:'3'};
const originalFormData=global.FormData;
beforeEach(()=>{global.FormData=jest.requireActual('react-native/Libraries/Network/FormData').default;});
afterEach(()=>{global.FormData=originalFormData;jest.restoreAllMocks();});
it('does not submit registration until the vehicle step is complete',async()=>{
  const request=jest.spyOn(global,'fetch').mockImplementation(jest.fn());
  await expect(registerDriver(account,{},{})).rejects.toThrow('Complete vehicle registration');
  expect(request).not.toHaveBeenCalled();
});
it('submits contact proof, selected vehicle and KYC together once, without a manual multipart header',async()=>{
  const request=jest.spyOn(global,'fetch').mockResolvedValue({ok:true,json:async()=>({success:true,access_token:'test-token',is_verified:0})} as Response);
  const result=await registerDriver(account,vehicle,{licence:{file:{uri:'file:///licence.jpg',type:'image/jpeg',name:'licence.jpg'},expiryDate:'2030-01-01'}});
  expect(result.is_verified).toBe(0);
  expect(request).toHaveBeenCalledTimes(1);
  const [url,options]=request.mock.calls[0];
  expect(url).toBe('https://example.invalid/api/driver/register');
  expect(options?.headers).toEqual({Accept:'application/json'});
  const parts=(options?.body as any).getParts();
  expect(parts.find((part:any)=>part.fieldName==='verification_token').string).toBe('verified-proof');
  expect(parts.find((part:any)=>part.fieldName==='vehicle[vehicle_type_id]').string).toBe('16');
  expect(parts.find((part:any)=>part.fieldName==='documents[0][file]').uri).toBe('file:///licence.jpg');
});
it('surfaces backend duplicate-email and validation failures instead of navigating into the app',async()=>{
  jest.spyOn(global,'fetch').mockResolvedValue({ok:false,json:async()=>({message:'This account is already registered as a driver.'})} as Response);
  await expect(registerDriver(account,vehicle,{})).rejects.toThrow('already registered');
});
