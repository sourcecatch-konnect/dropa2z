import React, { useEffect, useState } from 'react'
import {View} from 'react-native';
import {Text} from '../../../../../../design/Typography';
import DropDownPicker from 'react-native-dropdown-picker'
import appColors from '../../../../../../theme/appColors'
import { useTheme } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { vehicleTypeDataGet } from '../../../../../../api/store/action/vehicleTypeAction'
import { useValues } from '../../../../../../utils/context'
import { fontSizes, windowHeight } from '../../../../../../theme/appConstant'
import styles from './styles'
import { AppDispatch } from '../../../../../../api/store'
import Icons from '../../../../../../utils/icons/icons'
import {RegistrationVehicleGallery} from '../../../../../../design/RegistrationVehicleGallery';

interface RenderItemsProps {
  vehicleIndex?: number
  handleItemPress: (index: number, name: string, itemid?: number) => void
  selectedVehicle: string
  selectedCategory?: string
  serviceId?: any
  categoryId?: number
  selectedItemIndex?: number
  selectedVehicleID?: number
}

export function RenderVehicleList({
  handleItemPress,
  serviceId,
  categoryId,
  selectedVehicle,
  editable,
  onSelectCategory,
}: RenderItemsProps | any) {
  const dispatch = useDispatch<AppDispatch>()
  const { colors } = useTheme()
  const { rtl, isDark, viewRtlStyle } = useValues()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<number | null>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const { translateData } = useSelector((state: any) => state.setting)
  const categories=useSelector((state:any)=>state.serviceCategory.categoryData?.data)||[];
  const services=useSelector((state:any)=>state.service.serviceData?.data)||[];
  const [loading, setLoading] = useState<boolean>(true)


  useEffect(() => {
    let active = true
    setValue(null)
    setItems([])
    setVehicles([])
    if (!serviceId || !categoryId) {
      setLoading(false)
      return
    }
    setLoading(true)
    dispatch(vehicleTypeDataGet({ service_id: serviceId, service_category_id: categoryId }))
      .unwrap()
      .then(response => {
        if (!active) return
        const list = (Array.isArray(response) ? response : response?.data ?? []).filter((vehicle:any)=>{
          const label=`${vehicle.name||''} ${vehicle.slug||''}`;
          return !/scooter|freight|cargo|electric|roof.?rack/i.test(label)&&/\bbike\b|motorcycle|two.?wheeler|\bauto\b|rickshaw|three.?wheeler/i.test(label);
        })
        setVehicles(list)
        setItems(list.map((vehicle: any) => ({ label: vehicle.name, value: vehicle.id })))
        const selected = list.find((vehicle: any) => vehicle.name === selectedVehicle) ?? list[0]
        if (selected) {
          setValue(selected.id)
          handleItemPress(list.indexOf(selected), selected.name, selected.id, selected)
        }
      })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [serviceId, categoryId, dispatch])



  const handleValueChange = (itemValue: any) => {
    setValue(itemValue)
    const selectedItem = vehicles.find(
      (item: any) => item.id === itemValue,
    )
    if (selectedItem) {
      const selectedIndex = vehicles.findIndex(
        (item: any) => item.id === itemValue,
      )
      handleItemPress(selectedIndex, selectedItem.name, selectedItem.id, selectedItem)
    }
  }


  return (
    <View style={{width:'100%'}}>
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
        disabled={editable || loading || !categoryId}
        onChangeValue={handleValueChange}
        placeholder={translateData.selectCategory}
        containerStyle={styles.container}
        placeholderStyle={[
          styles.placeholderStyles,
          { color: isDark ? appColors.darkText : appColors.secondaryFont },
        ]}
        style={{
          backgroundColor: isDark ? appColors.darkThemeSub : appColors.white,
          borderColor: open ? appColors.primary : colors.border,
          flexDirection: viewRtlStyle,
          paddingHorizontal: windowHeight(1.9),
        }}
        dropDownContainerStyle={{
          backgroundColor: isDark ? colors.card : appColors.dropDownColor,
          borderColor: open ? appColors.border : colors.border,
          marginTop: 1,
        }}
        textStyle={[styles.text, { color: colors.text }]}
        labelStyle={[
          styles.text,
          { color: isDark ? appColors.white : appColors.black },
        ]}
        listItemLabelStyle={{
          color: isDark ? appColors.white : appColors.black,
        }}
        tickIconStyle={{
          tintColor: isDark ? appColors.white : appColors.black,
        }}
        arrowIconStyle={{
          tintColor: isDark ? appColors.white : appColors.black,
        }}
        textStyle={{
          textAlign: rtl ? 'right' : 'left',
          fontSize: fontSizes.FONT4,
        }}
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
          nestedScrollEnabled: true,
        }}
        zIndex={2}
        listMode="MODAL"
        dropDownDirection="AUTO"
        ListEmptyComponent={() => (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: windowHeight(1.3),
              zIndex: 2,
            }}
          >
            <Text style={{ color: colors.text }}>
              {translateData?.selectVehicleFirst}
            </Text>
          </View>
        )}
        ArrowDownIconComponent={({ style }) => (
          <View style={[{ transform: [{ rotate: '-90deg' }] }]}>
            <Icons.Back color={appColors.iconColor} />
          </View>
        )}
        ArrowUpIconComponent={({ style }) => (
          <View style={[{ transform: [{ rotate: '90deg' }] }]}>
            <Icons.Back color={appColors.iconColor} />
          </View>
        )}
      />
      {!editable&&<RegistrationVehicleGallery vehicles={vehicles} onSelect={vehicle=>handleValueChange(vehicle.id)} onSelectFamily={family=>{
        const service=services.find((item:any)=>String(item.id)===String(serviceId));
        if(service?.type==='freight'&&family==='bike')return false;
        const category=categories.find((item:any)=>item.service_type===service?.type&&String(item.slug)===`ride-${service.type}-${family}`&&Number(item.status??1)===1);
        if(!category||!onSelectCategory)return false;
        onSelectCategory(categories.indexOf(category),category.name,category.id,category.service_type);return true;
      }}/>} 
    </View>
  )
}
