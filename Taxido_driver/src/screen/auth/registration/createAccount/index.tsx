import React, { useCallback, useEffect, useState } from 'react'
import {View, TouchableOpacity, ScrollView, BackHandler} from 'react-native';
import {Text, TextInput} from '../../../../design/Typography';
import appColors from '../../../../theme/appColors'
import { ProgressBar } from '../component'
import { Input, Button } from '../../../../commonComponents'
import {
  useFocusEffect,
  useNavigation,
  useTheme,
} from '@react-navigation/native'
import { Header, TitleView } from '../../component'
import styles from './styles'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../../navigation/main/types'
import Icons from '../../../../utils/icons/icons'
import { useValues } from '../../../../utils/context'
import { windowWidth } from '../../../intro/onBoarding/styles'
import { useSelector } from 'react-redux'
import { useAppRoute } from '../../../../utils/navigation'
import { ValidatePhoneNumber, validateName } from '../../../../utils/validation'
import { windowHeight } from '../../../../theme/appConstant'

type navigation = NativeStackNavigationProp<RootStackParamList>

export function CreateAccount() {
  const navigation = useNavigation<navigation>()
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const [emailFormatWarning, setEmailFormatWarning] = useState<string>('')
  const { colors } = useTheme()
  const { textRtlStyle, viewRtlStyle, isDark, setAccountDetail, rtl } =
    useValues()
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState<boolean>(false)
  const { translateData, taxidoSettingData } = useSelector(
    (state: any) => state.setting,
  )
  const route = useAppRoute()
  const usercredential = route.params?.phoneNumber ?? ''
  const registrationProof = route.params?.registrationProof
  const verifiedChannel = route.params?.verifiedChannel ?? registrationProof?.type ??
    (route.params?.googleIdToken ? 'google' : route.params?.email ? 'email' : 'phone')
  const isPhoneVerified = verifiedChannel === 'phone'
  const isContactVerified = verifiedChannel === 'google' || verifiedChannel === 'email'
  const userType = route.params?.userType ?? ''
  // Dropa2z currently operates with Indian phone numbers only. Keep the
  // required payload value, without asking drivers to choose a country.
  const countryCode = { callingCode: ['91'], cca2: 'IN' }
  const [email, setEmail] = useState(route.params?.email ?? (usercredential.includes('@') ? usercredential : ''))
  const [referral, setReferral] = useState<string>('')
  const isEmailUser = !isPhoneVerified

  const [formData, setFormData] = useState({
    username: route.params?.name ?? '',
    name: route.params?.name ?? '',
    phoneNumber: isPhoneVerified ? usercredential : '',
    email: route.params?.email ?? (usercredential.includes('@') ? usercredential : ''),
    password: '',
    confirmPassword: '',
    countryCode: countryCode,
    referral: '',
    countryName: 'India',
  })

  useFocusEffect(
    useCallback(() => {
      setShowWarning(false)
      setEmailFormatWarning('')
      setError({
        username: '',
        name: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        countryCode: countryCode,
      })
    }, []),
  )

  const [error, setError] = useState<any>({
    username: '',
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: countryCode,
  })

  useEffect(() => {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
    const isEmail = emailRegex.test(usercredential.trim())
    if (isEmail) {
      const cleanEmail = usercredential.trim()
      setEmail(cleanEmail)
      setFormData(prev => ({ ...prev, email: cleanEmail }))
    } else {
      const cleanPhone = usercredential.trim()
      if (isPhoneVerified) {
        setPhoneNumber(cleanPhone)
        setFormData(prev => ({ ...prev, phoneNumber: cleanPhone }))
      }
    }
  }, [usercredential, isPhoneVerified])

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }))

    if (key === 'email') {
      setEmail(value)
      setEmailFormatWarning('')
    }
  }

  const gotoDocument = () => {
    const name = formData.name.trim()
    const phone = formData.phoneNumber.trim()
    const emailValue = formData.email.trim()
    const newErrors: any = {
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
    let hasError = false

    const phoneError = ValidatePhoneNumber(phone)
    if (isPhoneVerified && phoneError) {
      newErrors.phoneNumber = phoneError
      hasError = true
    }

    if (validateName(name)) {
      newErrors.name = validateName(name)
      hasError = true
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (isContactVerified && emailValue === '') {
      newErrors.email = translateData.emailVerifyyyyy
      hasError = true
    } else if (emailValue !== '' && !emailRegex.test(emailValue)) {
      newErrors.email = translateData.emailformateteee
      hasError = true
    }

    if ((formData.password || formData.confirmPassword) && formData.password.length < 8) {
      newErrors.password = translateData.passwordMinLength
      hasError = true
    }
    if ((formData.password || formData.confirmPassword) && !formData.confirmPassword) {
      newErrors.confirmPassword = translateData.confirmPassword
      hasError = true
    }

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = translateData.doNotMatch
      hasError = true
    }

    if (hasError) {
      setError(newErrors)
      setShowWarning(true)
      return
    }

    setError({ phoneNumber: '', email: '', password: '', confirmPassword: '' })
    setShowWarning(false)
    setAccountDetail({
      ...formData,
      email: emailValue,
      phoneNumber: isPhoneVerified ? phone : '',
      countryCode,
      countryName: 'India',
      verifiedChannel,
      verificationToken: registrationProof?.token,
      verificationContact: registrationProof?.contact,
      googleIdToken: route.params?.googleIdToken,
    })
    if(userType==='fleet')navigation.navigate('UploadedDocument',{type:userType});
    else navigation.navigate('VehicleRegistration');
  }

  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Login')
      return true
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    )

    return () => backHandler.remove()
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Header backgroundColor={isDark ? colors.card : appColors.white} />
      <ProgressBar fill={1} />
      <ScrollView
        style={[styles.subView, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.space}>
          <TitleView
            title={translateData.createAccount}
            subTitle={translateData.registerContent}
          />

          <View style={styles.name}>
            <Input
              title={translateData.name}
              titleShow={true}
              placeholder={translateData.enterYourName}
              value={formData.name}
              onChangeText={text => handleChange('name', text)}
              showWarning={!!error.name}
              warning={error.name}
              backgroundColor={
                isDark ? appColors.darkThemeSub : appColors.white
              }
              borderColor={colors.border}
            />
          </View>
          {isPhoneVerified && <>
          <Text
            style={[
              styles.mobileNumber,
              {
                color: isDark ? appColors.white : appColors.primaryFont,

                textAlign: textRtlStyle,
              },
            ]}
          >
            {translateData.mobileNumber}
          </Text>

          <View style={styles.country}>
            <View style={{ flexDirection: viewRtlStyle, width: '100%' }}>
              <View
                style={[
                  styles.codeComponent,
                  { right: rtl ? windowWidth(12) : windowWidth(0.5) },
                ]}
              >
                <View
                  style={[
                    styles.countryCode,
                    {
                      backgroundColor: isDark
                        ? appColors.darkThemeSub
                        : appColors.white,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={styles.pickerButton}
                  >
                    <Text
                      style={[
                        styles.codeText,
                        { color: isDark ? appColors.white : appColors.black },
                      ]}
                    >
                      +{countryCode.callingCode[0]}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.phone,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    flexDirection: viewRtlStyle,
                  },
                ]}
              >
                <TextInput
                  editable={false}
                  placeholder={translateData.enterPhone}
                  placeholderTextColor={
                    isDark ? appColors.darkText : appColors.secondaryFont
                  }
                  value={phoneNumber}
                  onChangeText={text => {
                    const phoneNoError = ValidatePhoneNumber(text)
                    // setError(phoneNoError)

                    setPhoneNumber(text)
                    setFormData(prev => ({
                      ...prev,
                      phoneNumber: text,
                    }))
                  }}
                  keyboardType="phone-pad"
                  style={[
                    styles.number,
                    {
                    backgroundColor: isPhoneVerified
                        ? isDark
                          ? appColors.darkThemeSub
                          : appColors.white
                        : isDark
                          ? appColors.darkThemeSub
                          : appColors.loaderBackground,
                    },
                    { color: isDark ? appColors.white : appColors.black },
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                />
              </View>
            </View>

              {isPhoneVerified && error.phoneNumber ? (
              <Text style={[styles.errorText, { textAlign: textRtlStyle }]}>
                {error.phoneNumber}
              </Text>
            ) : null}
          </View>
          </>}
          <View style={styles.email}>
            <Input
              editable={!isContactVerified}
              title={translateData.email}
              titleShow={true}
              placeholder={translateData.enterEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={text => {
                setEmail(text)
                handleChange('email', text)
              }}
              backgroundColor={
                isContactVerified
                  ? isDark
                    ? appColors.darkThemeSub
                    : appColors.white
                  : appColors.loaderBackground
              }
              showWarning={!!error.email}
              warning={error.email}
              borderColor={colors.border}
            />
          </View>
          <View style={{ bottom: windowHeight(0.8) }}>
            {emailFormatWarning !== '' && (
              <Text style={[styles.errorText, { textAlign: textRtlStyle }]}>
                {emailFormatWarning}
              </Text>
            )}
          </View>

          {isContactVerified && (
            <Text style={{ color: appColors.secondaryFont, marginBottom: windowHeight(1) }}>
              You can add and verify a mobile number later in Profile Settings.
            </Text>
          )}

          <Input
            title={translateData.createaccount}
            Optional={true}
            titleShow={true}
            placeholder={translateData.password}
            value={formData.password}
            warning={
              showWarning && formData.password === ''
                ? translateData.password
                : formData.password.length > 0 && formData.password.length < 8
                  ? translateData.passwordMinLength
                  : ''
            }
            onChangeText={text => handleChange('password', text)}
            showWarning={
              showWarning && !!formData.password && formData.password.length < 8
            }
            backgroundColor={isDark ? appColors.darkThemeSub : appColors.white}
            borderColor={colors.border}
            rightIcon={
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? (
                  <Icons.EyeOpen />
                ) : (
                  <Icons.EyeClose
                    color={isDark ? appColors.white : appColors.secondaryFont}
                  />
                )}
              </TouchableOpacity>
            }
            secureText={!isPasswordVisible}
            style={rtl ? styles.view : null}
          />

          <View style={styles.password}>
            <Input
              title={translateData.cPw}
              titleShow={true}
              Optional={true}
              placeholder={translateData.confirmPassword}
              value={formData.confirmPassword}
              onChangeText={text => handleChange('confirmPassword', text)}
              showWarning={!!error.confirmPassword}
              warning={error.confirmPassword}
              backgroundColor={
                isDark ? appColors.darkThemeSub : appColors.white
              }
              borderColor={colors.border}
              rightIcon={
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                  }
                >
                  {isConfirmPasswordVisible ? (
                    <Icons.EyeOpen />
                  ) : (
                    <Icons.EyeClose
                      color={isDark ? appColors.white : appColors.secondaryFont}
                    />
                  )}
                </TouchableOpacity>
              }
              secureText={!isConfirmPasswordVisible}
              style={rtl ? styles.view : null}
            />
          </View>
          {taxidoSettingData?.cabbooking_values?.activation?.referral_enable == 1 &&
            userType == 'driver' && (
              <View style={styles.password}>
                <Input
                  title={translateData?.referaalId}
                  placeholder={translateData?.enterreferaalId}
                  titleShow={true}
                  Optional={true}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={referral}
                  onChangeText={text => {
                    setReferral(text)
                    handleChange('referral', text)
                  }}
                  backgroundColor={
                    !isContactVerified
                      ? isDark
                        ? appColors.darkThemeSub
                        : appColors.white
                      : appColors.loaderBackground
                  }
                  borderColor={colors.border}
                />
              </View>
            )}
        </View>
        <View style={styles.margin}>
          <Button
            onPress={gotoDocument}
            title={translateData.next}
            backgroundColor={appColors.primary}
            color={appColors.white}
          />
        </View>
        <View style={{ height: windowHeight(45) }} />
      </ScrollView>
    </View>
  )
}
