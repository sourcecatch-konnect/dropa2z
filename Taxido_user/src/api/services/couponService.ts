import {requireApiSuccess} from '../responseError';
import {coupons, couponsVerify} from '../endpoints/couponeEndPoint';
import {CouponsVerifyInterface} from '../interface/couponInterface';
import {GET_API, POST_API} from '../methods';

export const couponListData = async (filters?: {service_id?: number}) => {
  return requireApiSuccess(await GET_API(coupons,{params:filters}), 'Could not load offers. Please try again.');
};

export const couponVerifyData = async (data: CouponsVerifyInterface) => {
  return requireApiSuccess(await POST_API(data, couponsVerify), 'Unable to apply coupon.');
};

const couponService = {
  couponListData,
  couponVerifyData,
};

export default couponService;
