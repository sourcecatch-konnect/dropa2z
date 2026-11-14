import {useKeyboardState} from '../../../utils/useKeyboardState';
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Alert, BackHandler, Keyboard, ScrollView, View } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import styles from './styles'
import appColors from '../../../theme/appColors'
import { Background, Header } from '../component'
import { LoginView } from './component/'
import { useValues } from '../../../utils/context'
import { AppDispatch } from '../../../api/store'
import {
  fleetsLogin,
  fleetSocialLogin,
  driverSocialLogin,
  selfDriverData,
  selfFleetData,
  taxidosettingDataGet,
  userLogin,
  userVerifyOtp,
} from '../../../api/store/action'
import { notificationHelper } from '../../../commonComponents'
import {
  DriverLoginInterface,
  FleetLoginInterface,
  VerifyOtpInterface,
} from '../../../api/interface/authInterface'
import { getValue, setValue } from '../../../utils/localstorage'
import { useAppNavigation } from '../../../utils/navigation'
import { getFCMToken } from '../../../utils/pushNotificationHandler'

import messaging from '@react-native-firebase/messaging'
import { GoogleSignin } from '@react-native-google-signin/google-signin'

export function Login() {
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting)
  const [cca2, setCca2] = useState('IN')
  const { isDark, setToken } = useValues()
  const dispatch = useDispatch<AppDispatch>()
  const navigation = useAppNavigation()
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [countryCode, setCountryCode] = useState('+91')
  const [demouser, setDemouser] = useState<boolean>(false)
  const [fcmToken, setFcmToken] = useState<string>('')
  const isFocused = useIsFocused()
  const formattedCountryCode = useMemo(() => {
    return countryCode.startsWith('+') ? countryCode.substring(1) : countryCode
  }, [countryCode])
  const [driverLoading, setDriverLoading] = useState<boolean>(false)
  const [fleetLoading, setFleetLoading] = useState<boolean>(false)
  const [googleLoading, setGoogleLoading] = useState<boolean>(false)
  const [selectedRole, setSelectedRole] = useState<'driver' | 'fleet' | null>(null)
  const fleetRegistrationValue = taxidoSettingData?.cabbooking_values?.activation?.fleet_registration
  const fleetSignupEnabled = ![0, '0', false, 'false'].includes(fleetRegistrationValue)
  const {visible:keyboardVisible}=useKeyboardState();

  

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '1008715010172-3emflha9cni0pt5j69oninv037ostmjr.apps.googleusercontent.com',
      offlineAccess: false,
      scopes: ['email', 'profile'],
    })
  }, [])

  const promptForMobileUpdate = useCallback((needed?: boolean) => {
    if (!needed) return
    setTimeout(() => {
      Alert.alert(
        'Add your mobile number',
        'Add and verify a mobile number to make it easier to reach you about deliveries. You can do this now or later in Profile Settings.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update now', onPress: () => navigation.navigate('ProfileSetting') },
        ],
      )
    }, 500)
  }, [navigation])

  const completeScopedTestLogin = useCallback(async (testToken: string) => {
    const payload: VerifyOtpInterface = {
      email_or_phone: phoneNumber,
      country_code: formattedCountryCode,
      token: testToken,
      email: null,
      fcm_token: fcmToken,
    }

    try {
      const verification = await dispatch(userVerifyOtp(payload)).unwrap()

      if (verification?.success && verification?.is_registered && verification?.access_token) {
        if (verification?.id) {
          messaging().subscribeToTopic(`user_${verification.id}`).catch(() => undefined)
        }

        await setValue('token', verification.access_token)
        setToken(verification.access_token)
        dispatch(selfDriverData())
        promptForMobileUpdate(verification?.needs_mobile_update)
        if (verification?.is_verified == '0') {
          navigation.navigate('Verification')
        } else {
          navigation.navigate('TabNav')
        }
        return
      }

      notificationHelper('', translateData?.loginFailed, 'error')
    } catch {
      notificationHelper('', translateData?.loginFailed, 'error')
    } finally {
      setDriverLoading(false)
    }
  }, [countryCode, dispatch, fcmToken, formattedCountryCode, navigation, phoneNumber, promptForMobileUpdate, setToken, translateData])

  useEffect(() => {
    dispatch(taxidosettingDataGet())
    const fetchToken = async () => {
      try {
        const token = await getValue('fcmToken')
        if (token) {
          setFcmToken(token)
        } else {
          const newToken = await getFCMToken()
          if (newToken) {
            setFcmToken(newToken)
            await setValue('fcmToken', newToken)
          }
        }
      } catch (error) { }
    }
    if (isFocused) {
      fetchToken()
    }
  }, [dispatch, isFocused])

  useEffect(() => {
    if (isFocused && !fleetSignupEnabled) {
      setSelectedRole('driver')
    }
  }, [fleetSignupEnabled, isFocused])

  const gotoOTP = useCallback(
    async (userType: string) => {
      setDriverLoading(true)
      const payload: DriverLoginInterface = {
        email_or_phone: phoneNumber,
        country_code: formattedCountryCode,
        fcm_token: fcmToken,
      }

      try {
        const res = await dispatch(userLogin(payload)).unwrap()
        if (res?.success) {
          await setValue('userType', userType)
          if (res?.test_bypass === true && typeof res?.test_token === 'string') {
            await completeScopedTestLogin(res.test_token)
            return
          }

          navigation.navigate('Otp', {
            countryCode,
            phoneNumber,
            demouser,
            cca2,
            userType,
          })
          notificationHelper(
            '',
            translateData?.otpSend,
            'success',
          )
          setDriverLoading(false)
        } else {
          notificationHelper('', res.message, 'error')
          setDriverLoading(false)
        }
      } catch (error) {
        notificationHelper('', translateData?.loginFailed, 'error')
        setDriverLoading(false)
      }
    },
    [
      dispatch,
      phoneNumber,
      formattedCountryCode,
      navigation,
      demouser,
      translateData,
      cca2,
      countryCode,
      fcmToken,
      completeScopedTestLogin,
    ],
  )

  const googleLogin = useCallback(async () => {
    if (!selectedRole) return
    setGoogleLoading(true)
    try {
      await GoogleSignin.signOut().catch(() => undefined)
      await GoogleSignin.hasPlayServices()
      const signInResult = await GoogleSignin.signIn()
      const idToken = signInResult?.data?.idToken
      if (!idToken) {
        throw new Error('Google did not return an identity token. Check the Driver app OAuth setup.')
      }

      const payload = {
        id_token: idToken,
        fcm_token: fcmToken || null,
      }
      const response = await dispatch(
        selectedRole === 'fleet' ? fleetSocialLogin(payload) : driverSocialLogin(payload),
      ).unwrap()

      if (!response?.success) {
        throw new Error(response?.message || 'Google sign-in could not be completed.')
      }

      if (!response?.is_registered) {
        if (selectedRole === 'driver') {
          navigation.navigate('CreateAccount', {
            userType: selectedRole,
            email: response?.email || signInResult?.data?.user?.email || '',
            name: response?.name || signInResult?.data?.user?.name || '',
            verifiedChannel: 'google',
            googleIdToken: idToken,
          })
        } else {
          notificationHelper('', 'This Google account is not registered as a Fleet Manager yet.', 'error')
        }
        return
      }

      await setValue('userType', selectedRole)
      await setValue('token', response.access_token)
      setToken(response.access_token)
      if (response?.id) {
        messaging().subscribeToTopic(`user_${response.id}`).catch(() => undefined)
      }
      await dispatch(selectedRole === 'fleet' ? selfFleetData() : selfDriverData())
      if (response?.is_verified == '0') {
        navigation.navigate('Verification')
      } else {
        navigation.navigate('TabNav')
      }
      promptForMobileUpdate(response?.needs_mobile_update)
    } catch (error: any) {
      const message = error?.message || 'Google sign-in was cancelled or unavailable.'
      if (!/cancel/i.test(message)) {
        notificationHelper('', message, 'error')
      }
    } finally {
      setGoogleLoading(false)
    }
  }, [dispatch, fcmToken, navigation, promptForMobileUpdate, selectedRole, setToken])

  const gotoOTPFleet = useCallback(
    async (userType: string) => {
      const payload: FleetLoginInterface = {
        email_or_phone: phoneNumber,
        country_code: formattedCountryCode,
        fcm_token: fcmToken,
      }

      try {
        const res = await dispatch(fleetsLogin(payload)).unwrap()
        if (res?.success) {
          await setValue('userType', userType)
          navigation.navigate('Otp', {
            countryCode,
            phoneNumber,
            demouser,
            cca2,
            userType,
          })
          notificationHelper(
            '',
            translateData?.otpSend,
            'success',
          )
          setFleetLoading(false)
        } else {
          notificationHelper('', res.message, 'error')
          setFleetLoading(false)
        }
      } catch (error) {
        notificationHelper('', translateData?.loginFailed, 'error')
        setFleetLoading(false)
      }
    },
    [
      dispatch,
      phoneNumber,
      formattedCountryCode,
      navigation,
      demouser,
      translateData,
      cca2,
      countryCode,
      fcmToken,
    ],
  )


  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp()
      return true
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    )

    return () => backHandler.remove()
  }, [])

  return (
    <View
      style={[
        styles.main,
        {
          backgroundColor: isDark
            ? appColors.darkThemeSub
            : appColors.graybackground,
        },
      ]}
    >
      <Header
        showBackButton={false}
        backgroundColor={isDark ? appColors.bgDark : appColors.graybackground}
      />
      {!keyboardVisible && <Background />}
      <View
        style={[
          styles.loginView,
          keyboardVisible && styles.loginViewKeyboard,
        ]}
      >
        <ScrollView
          style={styles.loginScrollView}
          contentContainerStyle={styles.loginScrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={keyboardVisible}
        >
          <LoginView
            gotoOTP={(userType: string) => {
              setDriverLoading(false)
              gotoOTP('driver')
            }}
            driverLoading={driverLoading}
            googleLoading={googleLoading}
            googleLogin={googleLogin}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            showRoleSelector={fleetSignupEnabled}
            setDriverLoading={setDriverLoading}
            fleetLoading={fleetLoading}
            setFleetLoading={setFleetLoading}
            gotoOTPFleet={gotoOTPFleet}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            setCountryCode={setCountryCode}
            borderColor={
              isDark ? appColors.primaryFont : appColors.graybackground
            }
            setCca2={setCca2}
            demouser={demouser}
            countryCode={formattedCountryCode}
          />
        </ScrollView>
      </View>
    </View>
  )
}
