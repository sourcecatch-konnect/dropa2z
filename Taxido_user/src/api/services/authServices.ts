import { requireApiSuccess } from '../responseError';
import {
  login,
  register,
  verifyOtp,
  userSelf,
  mailLogin,
  SocialLogin,
} from '../endpoints/authEndPoints';
import {
  UserLoginInterface,
  UserRegistrationPayload,
  VerifyOtpInterface,
  UserLoginEmailInterface,
  SocialLoginInterface,
} from '../interface/authInterface';
import {GET_API, POST_API} from '../methods';

export const userLogin = async (data: UserLoginInterface) => {
  return POST_API(data, login)
    .then(res => {
      return res;
    })
    .catch(e => {
      return e?.response;
    });
};

export const socialLogin = async (data: SocialLoginInterface) => {
  return POST_API(data, SocialLogin)
    .then(res => {
      return res;
    })
    .catch(e => {
      return e?.response;
    });
};

export const userVerifyOtp = async (data: VerifyOtpInterface) => {
  return requireApiSuccess(await POST_API(data, verifyOtp), 'Could not verify the code. Please try again.');
};

export const userRegistration = async (data: UserRegistrationPayload) => {
  return requireApiSuccess(await POST_API(data, register), 'Could not register. Please check your details.');
};

export const self = async () => {
  return GET_API(userSelf)
    .then(res => {
      return res;
    })
    .catch(e => {
      return e?.response;
    });
};

export const userMailLogin = async (data: UserLoginEmailInterface) => {
  return POST_API(data, mailLogin)
    .then(res => {
      return res;
    })
    .catch(e => {
      return e?.response;
    });
};



const authServices = {
  userLogin,
  socialLogin,
  userRegistration,
  userVerifyOtp,
  self,
  userMailLogin,
};

export default authServices;
