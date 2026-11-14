import {
  CURRENCY,
  LANGUAGE,
  SETTING,
  PLANS,
  TRANSLATE,
  TAXIDOSETTING,
} from '../types/index'
import settingServices from '../../services/settingService'
import { createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import {URL} from '../../config'
import {getValue} from '../../../utils/localstorage'
import {appLanguages, localizedDeliveryCopy} from '../../../utils/appLanguages'

// Fetching currency data
export const currencyDataGet = createAsyncThunk(CURRENCY, async () => {
  const response = await settingServices.currencyDataGet()
  return response?.data
})

// Fetching address data
export const addressDataGet = createAsyncThunk(CURRENCY, async () => {
  const response = await settingServices.addressDataGet()
  return response?.data
})

// Fetching setting data
export const settingDataGet = createAsyncThunk(SETTING, async () => {
  const response = await settingServices.settingDataGet();
  if (response?.data && typeof response.data === 'object') {
    response.data._status = response.status;
  }

  return response?.data;
});

// Fetching Taxido setting data
export const taxidosettingDataGet = createAsyncThunk(
  TAXIDOSETTING,
  async () => {
    const response = await settingServices.taxidosettingDataGet()
    return response?.data
  },
)

// Fetching Language data
export const languageDataGet = createAsyncThunk(LANGUAGE, async () => {
  const response = await settingServices.languageDataGet()
  return appLanguages(response?.data)
})

// Fetching plan data
export const planDataGet = createAsyncThunk(PLANS, async () => {
  const response = await settingServices.planDataGet()
  return response?.data
})

//translate data get
export const translateDataGet = createAsyncThunk(TRANSLATE, async () => {
  const response = await settingServices.translateDataGet()
  const locale = await getValue('selectedLanguage')
  let translations = response?.data
  // Hindi and Marathi are available in the app before their full Admin files
  // are published. Keep every un-translated key safely in English instead of
  // leaving controls blank while the new locale files are being filled in.
  const empty = !translations || translations === '[]' || (Array.isArray(translations) && !translations.length)
  if (empty && (locale === 'hi' || locale === 'mr')) {
    const english = await axios.get(`${URL}/api/translate/driver-app`, {headers: {Accept: 'application/json', 'Accept-Lang': 'en'}})
    translations = english.data
  }
  return localizedDeliveryCopy(translations, locale)
})
