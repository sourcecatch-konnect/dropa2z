import React from 'react';
import {useSelector} from 'react-redux';
import {Header} from '../../../commonComponents';
import {useValues} from '../../../utils/context';
import {LegalDocumentsPanel} from '../../../design/LegalDocumentsPanel';
import {URL} from '../../../api/config';
export function LegalDocuments() {const {taxidoSettingData}=useSelector((state:any)=>state.setting);const {isDark}=useValues();return <LegalDocumentsPanel header={<Header title="Policies & Documents"/>} setting={taxidoSettingData?.cabbooking_values?.setting} mode="driver" site={URL} dark={isDark}/>;}
