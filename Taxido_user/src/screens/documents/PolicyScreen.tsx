import React from 'react';
import {useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Header} from '@src/commonComponent';
import {ReferenceScreen} from '../../design/ReferenceChrome';
import {LegalDocumentsPanel} from '../../design/LegalDocumentsPanel';
import {useValues} from '../../utils/context';
import {URL} from '../../api/config';
export function PolicyScreen(){
  const route=useRoute(); const {isDark}=useValues();
  const {taxidoSettingData}=useSelector((state:any)=>state.setting);
  const privacy=route.name==='PrivacyPolicy';
  return <ReferenceScreen><LegalDocumentsPanel header={<Header value={privacy?'Privacy Policy':'Terms of Service'}/>} setting={taxidoSettingData?.cabbooking_values?.setting} mode="rider" site={URL} dark={isDark} policyKind={privacy?'privacy':'terms'}/></ReferenceScreen>;
}
