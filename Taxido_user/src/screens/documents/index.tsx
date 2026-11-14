import {ReferenceScreen} from '../../design/ReferenceChrome';
import React from 'react';
import {useSelector} from 'react-redux';
import {HeaderContainer} from '../../commonComponent';
import {useValues} from '../../utils/context';
import {LegalDocumentsPanel} from '../../design/LegalDocumentsPanel';
import {URL} from '../../api/config';
export function Documents() {const {taxidoSettingData}=useSelector((state:any)=>state.setting);const {isDark}=useValues();return <ReferenceScreen><LegalDocumentsPanel header={<HeaderContainer value="Documents"/>} setting={taxidoSettingData?.cabbooking_values?.setting} mode="rider" site={URL} dark={isDark}/></ReferenceScreen>;}
