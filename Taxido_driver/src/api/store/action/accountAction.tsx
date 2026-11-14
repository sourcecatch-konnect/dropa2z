import {
  UPDATEPROFILE,
  DELETE_ACCOUNT,
  SELF_DRIVER,
  SELF_FLEET,
  USER_BANKDETAILS,
  UPDATE_DOCUMENT,
  UPDATE_VEHICLE,
  COUNTRY,
  PREFERENCE,
  UPDATEMOBILEMAIL,
  VERIFYMOBILEMAIL
} from '../types/index'
import { accountServices } from '../../services/index'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { BankDetailsinterface, UpdateProfileInterface, updateVehicleInterface } from '../../interface/accountInterface'
import {requireApiSuccess} from '../../responseError'


export const selfDriverData = createAsyncThunk(SELF_DRIVER, async () => {
  const response = requireApiSuccess(await accountServices.selfDriverData(), 'Unable to load your driver profile.')
  const profile = response.data?.data ?? response.data
  if (!profile?.id) throw new Error('Your driver profile could not be loaded. Please try again.')
  return profile
})

export const selfFleetData = createAsyncThunk(SELF_FLEET, async () => {
  const response = requireApiSuccess(await accountServices.selfFleetData(), 'Unable to load your fleet profile.')
  const profile = response.data?.data ?? response.data
  if (!profile?.id) throw new Error('Your fleet profile could not be loaded. Please try again.')
  return profile
})

export const updateProfile = createAsyncThunk(UPDATEPROFILE, async (data: any) => {
  const response = await accountServices.updateProfile(data.data)
  if (response.status == 200) {
    data.dispatch(selfDriverData())
    return response?.data
  } else {
    return 'Error'
  }
})

export const deleteProfile = createAsyncThunk(DELETE_ACCOUNT, async () => {
  const response = await accountServices.deleteProfile()
  if (response.status == 200) {
    return response?.data
  } else {
    return 'Error'
  }
})

export const updateBankDetails = createAsyncThunk(
  USER_BANKDETAILS,
  async (data: BankDetailsinterface) => {
    const response = await accountServices.updateBankDetails(data)
    if (response.status == 200) {
      return response?.data
    } else {
      return response.data
    }
  },
)

export const updateDocument = createAsyncThunk(
  UPDATE_DOCUMENT,
  async (data: BankDetailsinterface) => {
    const response = await accountServices.updateDocument(data)
    if (response.status == 200) {
      return response?.data
    } else {
      return response.data
    }
  },
)

export const updateVehicle = createAsyncThunk(
  UPDATE_VEHICLE,
  async (data: updateVehicleInterface) => {
    const response = await accountServices.updateVehicleRegis(data)
    if (response.status == 200) {
      return response?.data
    } else {
      return response.data
    }
  },
)

export const countryData = createAsyncThunk(COUNTRY, async () => {
  const response = await accountServices.countryData()
  return response?.data
})

export const preferenceData = createAsyncThunk(PREFERENCE, async () => {
  const response = await accountServices.preferenceData()
  return response?.data
})

export const updateMobileEmail = createAsyncThunk(UPDATEMOBILEMAIL, async (data: UpdateProfileInterface) => {
  const response = await accountServices.updateMobileEmail(data);
  return response;
});

export const verifyMobileEmail = createAsyncThunk(VERIFYMOBILEMAIL, async (data: UpdateProfileInterface) => {
  const response = await accountServices.verifyMobileEmail(data);
  return response;
});
