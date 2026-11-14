import React, {useEffect, useState} from 'react';
import {ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View} from 'react-native';
import {Text, TextInput} from './Typography';
import {DesignIcon} from './DesignIcon';
import {useValues} from '../utils/context';
import {deletionPolicy} from '../api/services/accountService';

export function AccountDeletionDialog({visible, busy, error, onClose, onConfirm}: {
  visible: boolean; busy: boolean; error: string; onClose: () => void;
  onConfirm: (confirmation: {confirmation: string; acknowledged: boolean}) => void;
}) {
  const {isDark} = useValues();
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setStep(1); setTyped(''); setAcknowledged(false); setPolicy(null); setLoadError('');
    void deletionPolicy().then(response => {
      if (active) setPolicy(response.data.data);
    }).catch(() => {if (active) setLoadError('Could not load deletion information. Please retry.');});
    return () => {active = false;};
  }, [visible, attempt]);
  const ink = isDark ? '#F5F6F7' : '#202329';
  const muted = isDark ? '#CCD1D8' : '#59626E';
  const warning = policy?.requires_admin_after_deletion;
  const canDelete = typed === 'DELETE' && acknowledged && !!policy && !busy;
  const close = () => {if (!busy) onClose();};
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#00000088'}}>
      <View style={{maxHeight: '92%', width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, backgroundColor: isDark ? '#25282D' : '#FFFFFF', padding: 22}}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap: 16}}>
          <DesignIcon name="trash-2" color="#C83832" width={32} height={32}/>
          <Text accessibilityRole="header" style={{fontSize: 24, color: ink, fontWeight: '700'}}>{step === 1 ? 'Before you delete your account' : 'Confirm account deletion'}</Text>
          <Text style={{fontSize: 16, lineHeight: 23, color: muted}}>You will lose access to this account, saved locations and delivery history. Deleting your account cannot be undone.</Text>
          <Text style={{fontSize: 13, lineHeight: 19, color: muted}}>Some records may be retained for accounting, dispute resolution and legal requirements.</Text>
          {!policy && !loadError && <ActivityIndicator accessibilityLabel="Loading deletion information" color="#F47C00"/>}
          {!!loadError && <><Text accessibilityRole="alert" style={{color: '#C83832'}}>{loadError}</Text><Pressable onPress={() => setAttempt(value => value + 1)}><Text style={{color: '#D06000'}}>Retry</Text></Pressable></>}
          {!!warning && <View style={{padding: 14, borderRadius: 14, backgroundColor: isDark ? '#463219' : '#FFF3DF'}}><Text style={{color: isDark ? '#FFD08A' : '#794000', lineHeight: 21}}>You have deleted and registered an account before. Deleting again will require Admin approval to register with these contact details. Contact Dropa2z Admin to request an unlock.</Text></View>}
          {step === 2 && <>
            <Text style={{color: ink}}>Type DELETE to continue</Text>
            <TextInput testID="delete-confirmation" accessibilityLabel="Type DELETE" value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} editable={!busy} style={{borderWidth: 1.5, borderColor: '#9DA4AE', borderRadius: 12, padding: 14, color: ink}}/>
            <Pressable testID="delete-acknowledgement" accessibilityRole="checkbox" accessibilityState={{checked: acknowledged}} disabled={busy} onPress={() => setAcknowledged(value => !value)} style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
              <View style={{width: 24, height: 24, borderWidth: 2, borderColor: '#C83832', borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: acknowledged ? '#C83832' : 'transparent'}}><Text style={{color: '#FFFFFF'}}>{acknowledged ? '\u2713' : ''}</Text></View>
              <Text style={{flex: 1, color: ink, lineHeight: 21}}>{warning ? 'I understand the data-access loss and registration rule.' : 'I understand that deleting my account cannot be undone.'}</Text>
            </Pressable>
          </>}
          {!!error && <Text accessibilityRole="alert" style={{color: '#C83832', lineHeight: 21}}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={step === 1 ? !policy || busy : !canDelete} onPress={() => step === 1 ? setStep(2) : onConfirm({confirmation: typed, acknowledged})} style={{padding: 16, alignItems: 'center', borderRadius: 14, backgroundColor: (step === 1 ? !!policy && !busy : canDelete) ? '#C83832' : '#797F87'}}>
            {busy ? <ActivityIndicator color="#FFFFFF"/> : <Text style={{color: '#FFFFFF', fontSize: 16, fontWeight: '700'}}>{step === 1 ? 'Continue to confirmation' : 'Delete my account'}</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={close} style={{padding: 12, alignItems: 'center'}}><Text style={{color: ink, fontSize: 16, fontWeight: '700'}}>Keep my account</Text></Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
