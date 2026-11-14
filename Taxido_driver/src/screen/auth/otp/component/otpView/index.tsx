import {View, TouchableOpacity, Keyboard, Alert, StyleSheet} from 'react-native';
import {Text} from '../../../../../design/Typography';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles'
import { Button, notificationHelper } from '../../../../../commonComponents'
import appColors from '../../../../../theme/appColors'
import OTPTextView from 'react-native-otp-textinput'
import { LineAnimation } from '../../../login/component'
import { useNavigation, useTheme, useRoute, useIsFocused } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../../../navigation/main/types'
import { useValues } from '../../../../../utils/context'
import { DriverLoginInterface, FleetVerifyOtpInterface, VerifyOtpInterface } from '../../../../../api/interface/authInterface'
import { selfDriverData, settingDataGet, userVerifyOtp, userLogin, fleetsLogin, fleetsVerifyOtp } from '../../../../../api/store/action/index'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '../../../../../api/store/index'
import { getValue, setValue } from '../../../../../utils/localstorage/index'

import messaging from '@react-native-firebase/messaging';

type navigation = NativeStackNavigationProp<RootStackParamList>

const OtpView: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const route = useRoute<RouteProp<RootStackParamList, 'Otp'>>()
  const demouser = route.params || {}
  const { confirmation }: any = route.params
  const { translateData, settingData } = useSelector((state: any) => state.setting)
  const demoMode = settingData?.values?.activation?.demo_mode == 1
  const [warning, setWarning] = useState('')
  const [enteredOtp, setEnteredOtp] = useState(demoMode == true ? '123456' : '')
  const { colors } = useTheme()
  const { viewRtlStyle } = useValues()
  const { textRtlStyle, isDark, setToken, token } = useValues()
  const countryCode = route.params?.countryCode ?? '91'
  const phoneNumber = route.params?.phoneNumber ?? '1234567890'
  const cca2 = route?.params?.cca2 ?? 'IN'
  const userType = route?.params?.userType ?? 'driver'

  const [message, setMessage] = useState<string>('')
  const [fcmToken, setFcmToken] = useState('')
  const [success, setSuccess] = useState<boolean>(false)
  const dispatch = useDispatch<AppDispatch>()
  const { navigate } = useNavigation<navigation>()
  const [loading, setLoading] = useState(false)
  const emailOrPhone = demouser?.email_or_phone ?? phoneNumber
  const isEmail = emailOrPhone.includes('@')
  const input = useRef<OTPTextView>(null)
  const isFocused = useIsFocused()
  const [resendTimer, setResendTimer] = useState(30);
  const resendInFlight = useRef(false);
  const verificationInFlight = useRef(false)
  const formattedCountryCode = useMemo(() => {
    if (!countryCode) return '';
    return countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  }, [countryCode]);


  const handleChange = (otp: string) => {
    setEnteredOtp(otp)
    setMessage('')
    setWarning('')
    if (otp.length === 6) {
      Keyboard.dismiss()
      setWarning('')
    }
  }

  useEffect(() => {
    const fetchToken = async () => {
      let fcmToken = await getValue('fcmToken')
      if (fcmToken) {
        setFcmToken(fcmToken)
      }
    }
    fetchToken()
  }, [isFocused])

  const handleVerify = async () => {
    if (verificationInFlight.current) return
    if (!/^\d{6}$/.test(enteredOtp)) { setWarning('Enter the 6-digit code.'); return }
    verificationInFlight.current = true
    setLoading(true)
    const formatCountryCode = (code: string): string => {
      if (code.startsWith('+')) {
        return code.substring(1)
      }
      return code
    }
    let payload: VerifyOtpInterface = {
      email_or_phone: emailOrPhone,
      country_code: formatCountryCode(countryCode),
      token: enteredOtp,
      email: null,
      fcm_token: fcmToken,
    }

    dispatch(userVerifyOtp(payload))
      .unwrap()
      .then((res: any) => {
        setLoading(false)
        if (res?.success && res?.is_registered) {
          messaging()
            .subscribeToTopic(`user_${res?.id}`)
            .then(() => {

            });

          setValue('token', res.access_token)
          setToken(res.access_token)
          if (res?.is_verified == '0') {
            navigate('Verification')
          } else {
            navigate('TabNav')
          }
          if (res?.needs_mobile_update) {
            setTimeout(() => {
              Alert.alert(
                'Add your mobile number',
                'Add and verify a mobile number to make it easier to reach you about deliveries. You can do this now or later in Profile Settings.',
                [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Update now', onPress: () => navigate('ProfileSetting') },
                ],
              )
            }, 500)
          }
          dispatch(selfDriverData())
        } else if (res.success && !res.is_registered) {
          messaging()
            .subscribeToTopic(`user_${res?.id}`)
            .then(() => {

            });

          navigate('CreateAccount', {
            countryCode,
            phoneNumber,
            cca2,
            userType,
            verifiedChannel: res?.registration_proof?.type,
            registrationProof: res?.registration_proof,
          })
          dispatch(settingDataGet())
          setSuccess(false)
          setMessage(translateData?.noLinkAccount)
        } else if (!res.success) {
          setSuccess(false)
          setMessage(res.message)
        }
      })
      .catch((error: any) => {
        setLoading(false)
        setSuccess(false)
        setMessage(error?.message || 'The code is invalid or expired. Please try again.')
      })
      .finally(() => { verificationInFlight.current = false; setLoading(false) })
  }


  const handleVerifyFleet = async () => {
    if (verificationInFlight.current) return
    if (!enteredOtp || enteredOtp.length < 6) {
      setWarning(translateData?.validOtpEnter)
      return
    }
    verificationInFlight.current = true
    setLoading(true)

    const formatCountryCode = (code: string): string => {
      if (code.startsWith('+')) {
        return code.substring(1)
      }
      return code
    }
    let payload: FleetVerifyOtpInterface = {
      email_or_phone: phoneNumber,
      country_code: formatCountryCode(countryCode),
      token: enteredOtp,
      email: null,
      fcm_token: fcmToken,
    }

    dispatch(fleetsVerifyOtp(payload))
      .unwrap()
      .then((res: any) => {

        if (res.success && res.is_registered) {
          messaging()
            .subscribeToTopic(`user_${res?.id}`)  // or 'users', 'offers', etc.
            .then(() => {
            });

          setValue('token', res.access_token)
          setToken(res.access_token)
          if (res?.is_verified == '0') {
            navigate('Verification')
          } else {
            navigate('TabNav')
          }
          dispatch(selfDriverData()).then((res) => {
          })
        } else if (res.success && !res.is_registered) {
          messaging()
            .subscribeToTopic(`user_${res?.id}`)
            .then(() => {

            });

          navigate('CreateAccount', {
            countryCode,
            phoneNumber,
            cca2,
            userType
          })
          dispatch(settingDataGet())
          setSuccess(false)
          setMessage(translateData?.noLinkAccount)
        } else if (!res.success) {
          setSuccess(false)
          setMessage(res.message)
        }
      })
      .catch((error: any) => {
        setSuccess(false)
        setMessage(error?.message || 'The code is invalid or expired. Please try again.')
      })
      .finally(() => { verificationInFlight.current = false; setLoading(false) })
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])





  const handelGetOtp = async () => {
    if (resendTimer > 0 || resendInFlight.current) return;
    resendInFlight.current = true;
    const payload: DriverLoginInterface = {
      email_or_phone: emailOrPhone,
      country_code: formattedCountryCode,
      fcm_token: fcmToken
    };

    try {
      const res = await dispatch(userType === 'fleet' ? fleetsLogin(payload) : userLogin(payload)).unwrap();
      if (res?.success) {
        setEnteredOtp(''); setMessage(''); setWarning(''); input.current?.clear(); setResendTimer(30);
        await setValue('userType', userType);
        notificationHelper('', translateData?.otpSent, 'success');
      } else {
        notificationHelper('', res.message, 'error');
      }
    } catch (error) {
      notificationHelper('', translateData?.loginFailed, 'error');
    } finally {
      resendInFlight.current = false;
    }
  }





  return (
    <View
      style={[
        styles.otpView,
        { backgroundColor: isDark ? appColors.darkThemeSub : appColors.white },
      ]}
    >
      <View style={styles.subView}>
        {!compact && <View style={styles.space} />}
        {!compact && <LineAnimation />}
        <Text
          style={[
            styles.otpVef,
            compact && { marginTop: 0 },
            { color: colors.text, textAlign: textRtlStyle },
          ]}
        >
          {translateData?.otpVerification}
        </Text>


        <Text style={[styles.subtitle, { textAlign: textRtlStyle }]}>
          {isEmail
            ? `${(translateData?.verificationCodeSentTo || 'Enter the 6-digit code sent to')} ${emailOrPhone}`
            : `${(translateData?.verificationCodeSentTo || 'Enter the 6-digit code sent to')} ${formattedCountryCode} ${emailOrPhone}`}
        </Text>

        <Text
          style={[
            styles.title,
            compact && { marginTop: 8 },
            { color: colors.text, textAlign: textRtlStyle },
          ]}
        >
          {translateData?.otp}
        </Text>
        <View style={[styles.inputContainer, { flexDirection: viewRtlStyle }]}>
          <OTPTextView
            ref={input}
            containerStyle={StyleSheet.flatten([
              styles.otpContainer,
              { flexDirection: viewRtlStyle },
            ]) as any}
            textInputStyle={StyleSheet.flatten([
              styles.otpInput,
              {
                color: colors.text,
              },
            ]) as any}
            handleTextChange={handleChange}
            inputCount={6}
            keyboardType="numeric"
            tintColor={appColors.primary}
            offTintColor={isDark ? appColors.darkborder : appColors.line}
            defaultValue={enteredOtp}
          />
        </View>
        {warning !== '' && <Text style={styles.warningText}>{warning}</Text>}
        {message !== '' && <Text accessibilityRole="alert" style={styles.warningText}>{message}</Text>}
      </View>

      <View style={[styles.buttonView, compact && { marginTop: 16 }]}>
        <Button
          title={translateData?.verify}
          onPress={() => {
            if (userType == 'fleet') {
              handleVerifyFleet();
            } else if (userType == 'driver') {
              handleVerify();
            }
          }}
          backgroundColor={appColors.primary}
          color={appColors.white}
          loading={loading}
        />
      </View>
      <View style={styles.subView}>
        <View style={[styles.retry, { flexDirection: viewRtlStyle }]}>
          {resendTimer === 0 ? (
            <Text style={styles.notReceive}>{translateData?.notReceived}</Text>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              if (resendTimer === 0) {
                handelGetOtp()
              }
            }}
            activeOpacity={resendTimer === 0 ? 0.7 : 1}
            disabled={resendTimer !== 0}
          >
            <Text style={[styles.resend, { color: resendTimer === 0 ? colors.text : 'gray' }]}>
              {resendTimer === 0 ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default OtpView
