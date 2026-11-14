import {rideUpdate,rideDataGet} from '../src/api/services/rideService';
import {allpayment} from '../src/api/services/walletService';
import {GET_API,POST_API,PUT_API} from '../src/api/methods';
jest.mock('../src/api/methods',()=>({GET_API:jest.fn(),POST_API:jest.fn(),PUT_API:jest.fn()}));
beforeEach(()=>jest.clearAllMocks());
it('bounds update/payment requests and propagates errors instead of pretending success',async()=>{
 (PUT_API as jest.Mock).mockResolvedValue({status:422,data:{message:'Deliver every stop first'}});
 await expect(rideUpdate({ride_id:4,data:{status:'completed'}})).rejects.toThrow('Deliver every stop first');
 expect(PUT_API).toHaveBeenCalledWith({status:'completed'},'ride/4',{timeout:25000});
 (POST_API as jest.Mock).mockResolvedValue(Error('Network stalled'));
 await expect(allpayment({ride_id:4,payment_method:'cash'} as any)).rejects.toThrow();
 expect(POST_API).toHaveBeenCalledTimes(1);
 expect(POST_API).toHaveBeenCalledWith(expect.anything(),'ride/payment',{timeout:25000});
});
it('bounds the read used to reconcile an uncertain completion',async()=>{
 (GET_API as jest.Mock).mockResolvedValue({status:200,data:{id:4,ride_status:{slug:'completed'}}});
 await expect(rideDataGet(4)).resolves.toEqual(expect.objectContaining({status:200}));
 expect(GET_API).toHaveBeenCalledWith('ride/4',{timeout:15000});
});
