import { requireApiSuccess } from '../responseError'
import {
  login,
  register,
  verifyOtp,
  mailLogin,
  socialLogin,

  fleetLogin,
  fleetSocialLogin,
  fleetRegister,
  fleetVerifyOtp,
} from '../endpoints/authEndPoints'
import {
  DriverLoginInterface,
  DriverRegistrationPayload,
  VerifyOtpInterface,
  UserLoginEmailInterface,

  FleetLoginInterface,
  FleetVerifyOtpInterface,
  FleetRegistrationPayload,
} from '../interface/authInterface'
import { GET_API, POST_API } from '../methods'

export const userLogin = async (data: DriverLoginInterface) => {
  return POST_API(data, login)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const driverSocialLogin = async (data: { id_token: string; fcm_token: string | null }) => {
  return POST_API(data, socialLogin)
    .then(res => res)
    .catch(e => e?.response)
}

export const fleetSocialLoginRequest = async (data: { id_token: string; fcm_token: string | null }) => {
  return POST_API(data, fleetSocialLogin)
    .then(res => res)
    .catch(e => e?.response)
}

export const fleetsLogin = async (data: FleetLoginInterface) => {
  return POST_API(data, fleetLogin)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const userVerifyOtp = async (data: VerifyOtpInterface) => {
  return requireApiSuccess(await POST_API(data, verifyOtp), 'The code is invalid or expired. Please try again.')
}

export const fleetsVerifyOtp = async (data: FleetVerifyOtpInterface) => {
  return requireApiSuccess(await POST_API(data, fleetVerifyOtp), 'The code is invalid or expired. Please try again.')
}

export const userRegistration = async (data: DriverRegistrationPayload) => {
  return requireApiSuccess(await POST_API(data, register), 'Unable to register. Please check your details.')
}

export const fleetRegistration = async (data: FleetRegistrationPayload) => {
  return requireApiSuccess(await POST_API(data, fleetRegister), 'Unable to register. Please check your details.')
}

export const userMailLogin = async (data: UserLoginEmailInterface) => {
  return POST_API(data, mailLogin)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}



const authServices = {
  userLogin,
  driverSocialLogin,
  userRegistration,
  userVerifyOtp,
  userMailLogin,

  fleetsLogin,
  fleetSocialLoginRequest,
  fleetsVerifyOtp,
  fleetRegistration,
}

export default authServices
