import {referenceSurfaces} from '../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native'
import { windowHeight } from '../../../theme/appConstant'
import appFonts from '../../../theme/appFonts'

const vehicleStyles = StyleSheet.create({
  serviceList: {
    marginTop: windowHeight(6),
  },
  categoryList: {
    marginTop: windowHeight(0.8)
  },
  viewContainer: {
    marginTop: 12
  },
  Category: {
    marginTop: 12
  },
  vehicle: {
    marginTop: 12
  },
  vehicleNo: {
    marginTop: 12
  ,
    ...referenceSurfaces.control,
  },
  datePicker: {
    marginTop: 12
  },
  vehicleRegistrationDate: {
    fontFamily: appFonts.medium,
    marginBottom: windowHeight(1),
  },
  vehicleColor: {
    marginTop: 12
  },
  seat: {
    marginTop: 12
  },
  selectCategory: {
    marginTop: 12
  ,
    ...referenceSurfaces.control,
  },
  selectVehicle: {
    marginTop: 12
  ,
    ...referenceSurfaces.control,
  },
  vehicleName: {
    marginTop: 12
  ,
    ...referenceSurfaces.control,
  },
  registrationDate: {
    marginTop: 12
  },
  gotoDocument: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20
  },
  datePickerView: {
    marginTop: 12
  },
  selectVehicleView: {
    marginTop: 12
  },
  selectCategoryView: {
    marginTop: 12
  },
  selectServiceView: {
    minHeight: 64
  },
  renderServiceList: {
    marginTop: windowHeight(1)
  },
})

export default vehicleStyles
