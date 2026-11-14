import {acceptRequestValue,rejectRequestValue} from '../src/api/services/rideRequestService';
import {POST_API} from '../src/api/methods';
jest.mock('../src/api/methods',()=>({GET_API:jest.fn(),PUT_API:jest.fn(),POST_API:jest.fn()}));
beforeEach(()=>jest.resetAllMocks());
it('does not treat acceptance conflicts or business errors as assigned bookings',async()=>{
 (POST_API as jest.Mock).mockResolvedValue({status:409,data:{message:'Already assigned'}});
 await expect(acceptRequestValue({ride_request_id:12} as any)).rejects.toThrow('Already assigned');
 (POST_API as jest.Mock).mockResolvedValue({status:200,data:{success:false,message:'Offer expired'}});
 await expect(acceptRequestValue({ride_request_id:12} as any)).rejects.toThrow('Offer expired');
});
it('rejects failed Decline responses so the offer stays retryable',async()=>{
 (POST_API as jest.Mock).mockResolvedValue({status:500,data:{message:'Try again'}});
 await expect(rejectRequestValue({ride_request_id:12} as any)).rejects.toThrow('Try again');
 (POST_API as jest.Mock).mockResolvedValue({status:200,data:{success:true}});
 await expect(rejectRequestValue({ride_request_id:12} as any)).resolves.toMatchObject({status:200});
});
