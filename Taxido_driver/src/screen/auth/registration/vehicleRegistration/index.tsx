import React, { useState, useEffect } from 'react'
import {Alert, View, ScrollView} from 'react-native';
import {Text} from '../../../../design/Typography';
import styles from './styles'
import appColors from '../../../../theme/appColors'
import { CustomCheckbox, ProgressBar } from '../component'
import { Input, Button, notificationHelper } from '../../../../commonComponents'
import { useIsFocused, useNavigation, useTheme } from '@react-navigation/native'
import { Header, TitleView } from '../../component'
import {
  RenderVehicleList,
  RenderServiceList,
  RenderCategoryReg,
  RenderColorList,
} from './component'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../../navigation/main/types'
import { useValues } from '../../../../utils/context'
import { useDispatch, useSelector } from 'react-redux'
import { driverRuleGet } from '../../../../api/store/action/driverRuleAction'
import { fontSizes, windowHeight } from '../../../../theme/appConstant'
import { getValue, setValue } from '../../../../utils/localstorage'
import { selfDriverData } from '../../../../api/store/action'
import { URL } from '../../../../api/config'
import appFonts from '../../../../theme/appFonts'
import { AppDispatch } from '../../../../api/store'
import DropDownPicker from 'react-native-dropdown-picker'
import { validateVehicleNumber } from '../../../../utils/validation'

type Navigation = NativeStackNavigationProp<RootStackParamList>

export function VehicleRegistration() {
  const navigation = useNavigation<Navigation>()
  const { colors } = useTheme()
  const {
    textRtlStyle,
    setVehicleDetail,
    viewRtlStyle,
    isDark,
    accountDetail,
    documentDetail,
    setToken,
  } = useValues()
  const [showWarning, setShowWarning] = useState(false)
  const [vehicleNumberError, setVehicleNumberError] = useState('')
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  )
  const [selectedService, setSelectedService] = useState<string>('')
  const [categoryIndex, setCategoryIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [vehicleIndex, setVehicleIndex] = useState<number | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [selectedServiceID, setSelectedServiceID] = useState<any>()
  const [selectedCategoryID, setSelectedCategoryID] = useState<any>()
  const [selectedVehicleID, setSelectedVehicleID] = useState<
    number | undefined
  >(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [fcmToken, setFcmToken] = useState<string>('')
  const isFocused = useIsFocused()
  const { translateData } = useSelector((state: any) => state.setting)
  const { vehicleTypedata } = useSelector((state: any) => state.vehicleType)
  const dispatch = useDispatch<AppDispatch>()

  const [formDatas, setFormData] = useState<any>({
    serviceName: '',
    serviceCategory: '',
    vehicleType: '',
    vehicleName: '',
    vehicleNumber: '',
    vehicleColor: '',
    // Capacity is supplied by the selected vehicle type; it is not editable.
    maximumSeats: '1',
    ambulanceName: '',
    ambulanceDescription: '',
    experience: '',
    gear_type: '',
    price_per_day: '',
    price_per_hour: '',
    price_per_km: '',
  })

  const [openGear, setOpenGear] = useState(false)
  const [gearItems, setGearItems] = useState([
    { label: 'Manual', value: 'manual' },
    { label: 'Automatic', value: 'automatic' }
  ])
  const [selectedPriceTypes, setSelectedPriceTypes] = useState<string[]>([])

  useEffect(() => {
    const fetchToken = async () => {
      let fcmToken = await getValue('fcmToken')
      if (fcmToken) {
        setFcmToken(fcmToken)
      }
    }
    fetchToken()
  }, [isFocused])

  useEffect(() => {
    setFormData((prevData: any) => ({
      ...prevData,
      serviceName: selectedServiceID,
      serviceCategory: selectedCategoryID,
      vehicleType: selectedVehicleID,
    }))
  }, [selectedServiceID, selectedCategoryID, selectedVehicleID])

  useEffect(() => {
    getService()
  }, [])

  const getService = () => {
    dispatch(driverRuleGet())
  }
  const [vehicleColorError, setVehicleColorError] = useState(false)

  const handleChange = (key: string, value: string) => {
    if (key === 'vehicleColor') {
      const hasNumber = /\d/.test(value)
      if (hasNumber) {
        setVehicleColorError(true)
      } else {
        setVehicleColorError(false)
      }
      setFormData((prev: any) => ({ ...prev, [key]: value }))
      return
    }

    setFormData((prev: any) => ({ ...prev, [key]: value }))

  }

  const handleItemPress = (
    index: number,
    slug: string,
    id: number,
    name: string,
  ) => {
    setSelectedItemIndex(index)
    if (selectedServiceID !== id) {
      setSelectedCategory('')
      setSelectedCategoryID(undefined)
      setCategoryIndex(null)
      setVehicleIndex(null)
      setSelectedVehicle('')
      setSelectedVehicleID(undefined)
    }
    setSelectedServiceID(id)
    setSelectedService(slug)
    setShowServiceError(false)
  }

  const handleCategoryPress = (
    index: number,
    categoryName: string,
    categoryId: number,
  ) => {
    setCategoryIndex(index)
    if (selectedCategoryID !== categoryId) {
      setSelectedVehicle('')
      setSelectedVehicleID(undefined)
    }
    setSelectedCategory(categoryName)
    setSelectedCategoryID(categoryId)
    setShowCategoryError(false)
  }

  const handleVehiclePress = (
    index: number,
    vehicleName: string,
    vehicleId: number,
    details?: any,
  ) => {
    setVehicleIndex(index)
    setSelectedVehicle(vehicleName)
    setSelectedVehicleID(vehicleId)
    setShowVehicleError(false)

    const selectedItem = details || vehicleTypedata?.data?.find(
      (item: any) => item.id === vehicleId,
    )
    if (selectedItem) {
      setFormData((prev: any) => ({
        ...prev,
        maximumSeats: String(Number(selectedItem.seat)||1),
      }))
    }
  }

  const gotoBankDetails = () => {
    const plateError = validateVehicleNumber(formDatas.vehicleNumber)
    setVehicleNumberError(plateError)
    if (plateError) {
      notificationHelper('', plateError, 'error')
      return
    }
    const isAmbulance = selectedService === 'ambulance'
    const serviceSlug = selectedService?.toLowerCase().replace(/[-_]/g, '')
    const isFindDriver = serviceSlug === 'finddriver'

    let hasError = false

    if (isAmbulance) {
      if (
        formDatas.ambulanceName.trim() === '' ||
        formDatas.ambulanceDescription.trim() === ''
      ) {
        setShowWarning(true)
        hasError = true
      } else {
        setShowWarning(false)
      }
    } else if (isFindDriver) {
      if (formDatas.experience.trim() === '' || !formDatas.gear_type || selectedVehicleID === null) {
        setShowWarning(true)
        hasError = true
      }
      if (selectedVehicleID === null) {
        setShowVehicleError(true)
      } else {
        setShowVehicleError(false)
      }
      if (selectedPriceTypes.length === 0) {
        setShowWarning(true)
        hasError = true
      } else {
        selectedPriceTypes.forEach(type => {
          if (formDatas[`price_per_${type}`].trim() === '') {
            setShowWarning(true)
            hasError = true
          }
        })
      }
    } else {
      const hasEmptyFields = [
        'vehicleName',
        'vehicleNumber',
        'vehicleColor',
      ].some(key => formDatas[key].trim() === '')

      if (!selectedService) {
        setShowServiceError(true)
        hasError = true
      }

      if (!selectedCategoryID) {
        setShowCategoryError(true)
        hasError = true
      }

      if (!selectedVehicleID) {
        setShowVehicleError(true)
        hasError = true
      }

      if (hasEmptyFields) {
        setShowWarning(true)
        hasError = true
      } else {
        setShowWarning(false)
      }

    }

    if (selectedCategory === 'Rental') {
      hasError = false
    }

    if (hasError) {
      return
    }
    setVehicleDetail(formDatas)
    handleRegister()
  }

  const handleRegister = async () => {
    setVehicleDetail(formDatas);
    navigation.navigate('UploadedDocument', {type:'driver'});
  }

  const [showCategoryError, setShowCategoryError] = useState<boolean>(false)
  const [showVehicleError, setShowVehicleError] = useState<boolean>(false)
  const [showServiceError, setShowServiceError] = useState<boolean>(false)
  const [selectedColor, setSelectedColor] = useState<string>('')

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    handleChange('vehicleColor', color)
  }

  return (
    <View style={{ flex: 1 }}>
      <Header backgroundColor={isDark ? colors.card : appColors.white} />
      <ProgressBar fill={2} />
      <ScrollView style={[styles.main]} showsVerticalScrollIndicator={false}>
        <View style={[styles.subView, { backgroundColor: colors.background }]}>
          <View style={styles.subContainer}>
            <TitleView
              title={translateData.vehicleRegistration}
              subTitle={translateData.registerContent}
            />

            <Text
              style={[
                styles.vehicleTitle,
                { textAlign: textRtlStyle },
                { color: isDark ? appColors.white : appColors.primaryFont },
              ]}
            >
              {translateData.selectService}
            </Text>
            <View style={{ flexDirection: viewRtlStyle }}>
              <RenderServiceList
                selectedItemIndex={selectedItemIndex}
                handleItemPress={handleItemPress}
              />
            </View>
            {showServiceError && (
              <Text
                style={{
                  color: appColors.red,
                  marginBottom: windowHeight(0.5),
                  fontSize: fontSizes.FONT3,
                }}
              >
                {translateData.plpleaseSelectaServiceErrorrr}
              </Text>
            )}

            {selectedService === 'ambulance' ? null : (
              <>
                <Text
                  style={[
                    styles.vehicleTitle,
                    { textAlign: textRtlStyle },
                    { color: isDark ? appColors.white : appColors.primaryFont },
                  ]}
                >
                  {translateData.selectCategory}
                </Text>
                <View style={{ flexDirection: viewRtlStyle }}>
                  <RenderCategoryReg
                    categoryIndex={categoryIndex}
                    handleItemPress={handleCategoryPress}
                    selectedService={selectedService}
                    selectedCategory={selectedCategory}
                  />
                </View>
                {showCategoryError && (
                  <Text
                    style={{
                      color: appColors.red,
                      fontSize: fontSizes.FONT3,
                      bottom: windowHeight(1.5),
                    }}
                  >
                    {translateData.pleaseSelectaCategoryyyyErrorrr}
                  </Text>
                )}
              </>
            )}

            {(() => {
              const serviceSlug = selectedService?.toLowerCase().replace(/[-_]/g, '')
              const isFindDriver = serviceSlug === 'finddriver'

              if (selectedCategory === 'Rental') {
                return (
                  <View style={styles.rentalBg}>
                    <Text style={styles.rentalDesc}>
                      {translateData.registrationNotice} '
                      <Text style={styles.boldText}>
                        {translateData.vehicleList}
                      </Text>
                    </Text>
                  </View>
                )
              }

              if (isFindDriver) {
                return (
                  <View>
                    <View style={styles.vehicle}>
                      <Text
                        style={[
                          styles.vehicleTitle,
                          { textAlign: textRtlStyle },
                          {
                            color: isDark
                              ? appColors.white
                              : appColors.primaryFont,
                          },
                          { bottom: windowHeight(0) },
                        ]}
                      >
                        {translateData.selectVehicle}
                      </Text>
                      <View style={{ flexDirection: viewRtlStyle, width: "100%" }}><View style={{flex:1,minWidth:0}}><RenderVehicleList onSelectCategory={handleCategoryPress}
                            vehicleIndex={vehicleIndex}
                            handleItemPress={handleVehiclePress}
                            selectedCategory={selectedCategory}
                            serviceId={selectedServiceID}
                            categoryId={selectedCategoryID}
                            selectedVehicleID={selectedVehicleID}
                          />
                          {showVehicleError && (
                            <Text
                              style={[
                                styles.warning1,
                                {
                                  textAlign: textRtlStyle,
                                },
                              ]}
                            >
                              {translateData.pleaseSelectaVehicleeErrorrr}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.experienceInput}>
                      <Input
                        title={"Experience (Years)"}
                        titleShow={true}
                        placeholder={"Enter Experience"}
                        value={formDatas.experience}
                        onChangeText={text => handleChange('experience', text)}
                        keyboardType="numeric"
                        showWarning={showWarning && formDatas.experience === ''}
                        warning={"Please enter experience"}
                        backgroundColor={isDark ? appColors.darkThemeSub : appColors.white}
                      />
                    </View>

                    <Text style={[styles.priceType, { color: isDark ? appColors.white : appColors.primaryFont }]}>
                      Price Type
                    </Text>
                    <View style={styles.priceTypeContainer}>
                      {['day', 'hour', 'km'].map((type) => (
                        <View key={type} style={styles.checkboxItem}>
                          <CustomCheckbox
                            label={`Per ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                            checked={selectedPriceTypes.includes(type)}
                            onPress={() => {
                              setSelectedPriceTypes(prev =>
                                prev.includes(type)
                                  ? prev.filter(t => t !== type)
                                  : [...prev, type]
                              )
                            }}
                          />
                        </View>
                      ))}
                    </View>

                    {selectedPriceTypes.map((type) => (
                      <View key={type} style={styles.priceFields}>
                        <Input
                          title={`Price Per ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                          titleShow={true}
                          placeholder={`Enter price per ${type}`}
                          value={formDatas[`price_per_${type}`]}
                          onChangeText={text => handleChange(`price_per_${type}`, text)}
                          keyboardType="numeric"
                          showWarning={showWarning && formDatas[`price_per_${type}`] === ''}
                          warning={`Please enter price per ${type}`}
                          backgroundColor={isDark ? appColors.darkThemeSub : appColors.white}
                        />
                      </View>
                    ))}

                    <Text style={[styles.vehicleTitle, { color: isDark ? appColors.white : appColors.primaryFont }]}>
                      Gear Type
                    </Text>
                    <DropDownPicker
                      open={openGear}
                      value={formDatas.gear_type}
                      items={gearItems}
                      setOpen={setOpenGear}
                      setValue={callback => {
                        const val = typeof callback === 'function' ? callback(formDatas.gear_type) : callback
                        handleChange('gear_type', val)
                      }}
                      setItems={setGearItems}
                      placeholder="Select Gear Type"
                      containerStyle={styles.dropdownContainer}
                      style={[
                        styles.dropdown,
                        {
                          backgroundColor: isDark ? appColors.darkThemeSub : appColors.white,
                          borderColor: appColors.border
                        }
                      ]}
                      textStyle={[styles.dropdownText, { color: isDark ? appColors.white : appColors.black }]}
                      dropDownContainerStyle={{
                        backgroundColor: isDark ? appColors.darkThemeSub : appColors.white,
                        borderColor: appColors.border
                      }}
                      zIndex={3000}
                      zIndexInverse={1000}
                    />
                  </View>
                )
              }

              return (
                <>
                  {selectedService === 'ambulance' ? (
                    <>
                      <View
                        style={[
                          styles.vehicleNo,
                          { marginTop: windowHeight(3.5) },
                        ]}
                      >
                        <Input
                          title={translateData.ambulanceName}
                          titleShow={true}
                          placeholder={translateData.enterHospitalName}
                          value={formDatas.ambulanceName}
                          onChangeText={text =>
                            handleChange('ambulanceName', text)
                          }
                          showWarning={
                            showWarning && formDatas.ambulanceName === ''
                          }
                          warning={translateData.pleaseEnterAmbulanceNameeeee}
                          backgroundColor={
                            isDark ? appColors.darkThemeSub : appColors.white
                          }
                        />
                      </View>
                      <View style={styles.vehicleColor}>
                        <Text
                          style={{
                            marginBottom: windowHeight(1),
                            marginTop: windowHeight(2),
                            color: appColors.black,
                            fontFamily: appFonts.medium,
                            textAlign: textRtlStyle,
                          }}
                        >
                          {translateData.ambulanceDescription}
                        </Text>
                        <Input
                          placeholder={translateData.enterAmbulanceDescription}
                          value={formDatas.ambulanceDescription}
                          onChangeText={text =>
                            handleChange('ambulanceDescription', text)
                          }
                          multiline={true}
                          numberOfLines={4}
                          textAlignVertical="top"
                          backgroundColor={
                            isDark ? appColors.darkThemeSub : appColors.white
                          }
                          style={{ height: windowHeight(15), color: appColors.black }}
                        />
                        {showWarning && formDatas.ambulanceDescription === '' && (
                          <Text
                            style={[styles.warning1, { textAlign: textRtlStyle }]}
                          >
                            {translateData.pleaseEnterAmbulanceDescriptionnnnn}
                          </Text>
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.vehicle}>
                        <Text
                          style={[
                            styles.vehicleTitle,
                            { textAlign: textRtlStyle },
                            {
                              color: isDark
                                ? appColors.white
                                : appColors.primaryFont,
                            },
                            { bottom: windowHeight(0) },
                          ]}
                        >
                          {translateData.selectVehicle}
                        </Text>
                        <View style={{ flexDirection: viewRtlStyle, width: "100%" }}><View style={{flex:1,minWidth:0}}><RenderVehicleList onSelectCategory={handleCategoryPress}
                              vehicleIndex={vehicleIndex}
                              handleItemPress={handleVehiclePress}
                              selectedCategory={selectedCategory}
                              serviceId={selectedServiceID}
                              categoryId={selectedCategoryID}
                              selectedVehicleID={selectedVehicleID}
                            />
                            {showVehicleError && (
                              <Text
                                style={[
                                  styles.warning1,
                                  {
                                    textAlign: textRtlStyle,
                                  },
                                ]}
                              >
                                {translateData.pleaseSelectaVehicleeErrorrr}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={styles.vehicleName}>
                        <Input
                          title={translateData.vehicleName}
                          titleShow={true}
                          placeholder={translateData.enterVehicleNames}
                          value={formDatas.vehicleName}
                          onChangeText={text => handleChange('vehicleName', text)}
                          showWarning={
                            showWarning && formDatas.vehicleName === ''
                          }
                          warning={translateData.enterYourvehicleName}
                          backgroundColor={
                            isDark ? appColors.darkThemeSub : appColors.white
                          }
                          icon={false}
                        />
                      </View>
                      <View style={styles.vehicleNo}>
                        <Input
                          title={translateData.vehicleNo}
                          titleShow={true}
                          placeholder={translateData.rnterVehicleNo}
                          value={formDatas.vehicleNumber}
                          onChangeText={text =>
                            handleChange('vehicleNumber', text.toUpperCase())
                          }
                          showWarning={
                            !!vehicleNumberError || (showWarning && formDatas.vehicleNumber === '')
                          }
                          warning={vehicleNumberError || translateData.pleaseEnterVehicleNo}
                          backgroundColor={
                            isDark ? appColors.darkThemeSub : appColors.white
                          }
                        />
                      </View>
                      <View style={styles.vehicleColor}>
                        <Text
                          style={{
                            marginBottom: windowHeight(1),
                            marginTop: windowHeight(2),
                            color: isDark
                              ? appColors.white
                              : appColors.primaryFont,
                            fontFamily: appFonts.medium,
                            textAlign: textRtlStyle,
                          }}
                        >
                          {translateData.vehicleColor}
                        </Text>
                        <RenderColorList
                          selectedColor={selectedColor}
                          handleColorSelect={handleColorSelect}
                        />
                        {showWarning && formDatas.vehicleColor === '' && (
                          <Text
                            style={[
                              styles.warning1,
                              {
                                textAlign: textRtlStyle,
                                marginTop: windowHeight(-1),
                                marginBottom: windowHeight(2),
                              },
                            ]}
                          >
                            {translateData.pleaseEnterVehicleColor ||
                              'Please select vehicle color'}
                          </Text>
                        )}
                      </View>
                    </>
                  )}
                </>
              )
            })()}
          </View>
          <View style={[{ marginBottom: windowHeight(3) }]}>
            <Button
              onPress={gotoBankDetails}
              title={translateData.register}
              backgroundColor={appColors.primary}
              color={appColors.white}
              loading={loading}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
