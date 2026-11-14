const mockConnect=jest.fn();
const mockEcho=jest.fn().mockImplementation(()=>({connect:jest.fn(),disconnect:jest.fn(),connector:{pusher:{connection:{state:'connected'},connect:mockConnect}}}));
jest.mock('laravel-echo',()=>({__esModule:true,default:mockEcho}));
jest.mock('pusher-js/react-native',()=>({logToConsole:false}));
jest.mock('../src/utils/localstorage',()=>({getValue:async()=> 'session-token'}));
jest.mock('../src/api/config',()=>({URL:'https://example.test'}));
it('reuses the scoped socket without recreating it or losing channel subscriptions',async()=>{
  global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({enabled:true,key:'public-key',host:'example.test',tls:true,port:443})});
  const {default:getEcho,releaseScopedEcho}=require('../src/utils/echo');
  const first=await getEcho('booking-summary');
  expect(await getEcho('booking-summary')).toBe(first);
  expect(mockEcho).toHaveBeenCalledTimes(1);expect(first.connect).not.toHaveBeenCalled();
  first.connector.pusher.connection.state='disconnected';
  expect(await getEcho('booking-summary')).toBe(first);expect(mockConnect).toHaveBeenCalledTimes(1);
  releaseScopedEcho('booking-summary',first);
  expect(first.disconnect).toHaveBeenCalledTimes(1);
  expect(await getEcho('booking-summary')).not.toBe(first);expect(mockEcho).toHaveBeenCalledTimes(2);
});
