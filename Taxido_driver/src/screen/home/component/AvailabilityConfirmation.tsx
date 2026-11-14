import {BrandLoader} from '../../../design/BrandLogo';
import React from 'react';
import {Modal, View, TouchableOpacity, ActivityIndicator, StyleSheet} from 'react-native';
import {Text} from '../../../design/Typography';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/** A native modal sits above the tab bar; its actions cannot be clipped by a map sheet. */
export function AvailabilityConfirmation({visible,busy=false,dark=false,title,cancelLabel,confirmLabel,onCancel,onConfirm}:{visible:boolean;busy?:boolean;dark?:boolean;title:string;cancelLabel:string;confirmLabel:string;onCancel:()=>void;onConfirm:()=>void}) {
  const insets=useSafeAreaInsets();
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={()=>{if(!busy)onCancel();}} statusBarTranslucent>
    <View style={[styles.overlay,{paddingBottom:Math.max(20,insets.bottom+12),paddingTop:Math.max(20,insets.top)}]}>
      <View accessibilityViewIsModal style={[styles.card,{backgroundColor:dark?'#202422':'#FFFFFF'}]}>
        <Text style={[styles.title,{color:dark?'#FFFFFF':'#111111'}]}>{title}</Text>
        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={cancelLabel} disabled={busy} onPress={onCancel} style={[styles.button,{backgroundColor:dark?'#343B37':'#F3F1F0'}]}><Text style={[styles.label,{color:dark?'#FFFFFF':'#111111'}]}>{cancelLabel}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={confirmLabel} disabled={busy} onPress={onConfirm} style={[styles.button,{backgroundColor:'#E43F42'}]}>{busy?<BrandLoader color="#FFFFFF"/>:<Text style={[styles.label,{color:'#FFFFFF'}]}>{confirmLabel}</Text>}</TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>;
}
const styles=StyleSheet.create({overlay:{flex:1,backgroundColor:'rgba(0,0,0,.35)',justifyContent:'center',alignItems:'center',paddingHorizontal:20},card:{width:'100%',maxWidth:440,borderRadius:22,padding:22},title:{fontSize:19,lineHeight:27,fontWeight:'700',textAlign:'center',marginBottom:22},actions:{flexDirection:'row',gap:12},button:{flex:1,minHeight:48,paddingVertical:13,paddingHorizontal:12,borderRadius:12,alignItems:'center',justifyContent:'center'},label:{fontSize:16,fontWeight:'700',textAlign:'center'}});
