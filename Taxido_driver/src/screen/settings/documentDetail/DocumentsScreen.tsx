import {BrandLoader} from '../../../design/BrandLogo';
import {DOCUMENT_MAX_MB, validateDocumentFile} from '../../../utils/documentUpload';
import {ReferenceScreen} from '../../../design/ReferenceChrome';
import React, {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Image, Linking, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Text} from '../../../design/Typography';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useDispatch, useSelector} from 'react-redux';
import {Button, Header, notificationHelper} from '../../../commonComponents';
import {GET_API} from '../../../api/methods';
import {requireApiSuccess} from '../../../api/responseError';
import {selfDriverData} from '../../../api/store/action';
import {URL} from '../../../api/config';
import {getValue} from '../../../utils/localstorage';
import {useValues} from '../../../utils/context';
import {DesignIcon} from '../../../design/DesignIcon';
import {brand} from '../../../design/tokens';
import {safeDocumentUrl} from '../../../design/policyLinks';
import {DocumentDefinition, DocumentDraft, documentDate, documentUpdates, existingDocument, localDocumentDate} from './documentState';

export function DocumentDetail() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const {selfDriver} = useSelector((state: any) => state.account);
  const {isDark} = useValues();
  const insets = useSafeAreaInsets();
  const role = selfDriver?.role === 'fleet_manager' ? 'fleet_manager' : 'driver';
  const [definitions, setDefinitions] = useState<DocumentDefinition[]>([]);
  const [records, setRecords] = useState<any[]>(selfDriver?.documents ?? []);
  const [drafts, setDrafts] = useState<Record<string, DocumentDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dateSlug, setDateSlug] = useState<string | null>(null);
  const saveInFlight = useRef(false), pickInFlight = useRef(false), generation = useRef(0);
  const colors = {ink: isDark ? '#FFFFFF' : brand.ink, surface: isDark ? '#25282D' : '#FFFFFF', canvas: isDark ? '#17191C' : brand.canvas, muted:isDark?'#BBC1CA':brand.muted, border:isDark?'#41464E':brand.border, accent:isDark?'#FFBE60':'#A64B00'};

  const load = useCallback(async () => {
    const ticket = ++generation.current; setLoading(true); setError('');
    try {
      const kinds = role === 'fleet_manager' ? ['fleet_manager'] : ['driver', 'vehicle'];
      const responses = await Promise.all([
        GET_API('driver/self', {timeout: 15000}),
        ...kinds.map(type => GET_API(`document?type=${type}&status=1&paginate=100`, {timeout: 15000})),
      ]);
      responses.forEach(response => requireApiSuccess(response, 'Unable to load your documents.'));
      const profile = responses[0].data?.data ?? responses[0].data;
      const available = responses.slice(1).flatMap(response => {
        if (!Array.isArray(response.data?.data)) throw new Error('The document list could not be read.');
        return response.data.data;
      });
      if (generation.current !== ticket) return;
      setDefinitions(available.filter((item, i) => available.findIndex(other => other.slug === item.slug) === i));
      setRecords(profile?.documents ?? []);
    } catch (cause: any) {if (generation.current === ticket) setError(cause?.message || 'Unable to load your documents.');}
    finally {if (generation.current === ticket) setLoading(false);}
  }, [role]);
  useFocusEffect(useCallback(() => {load(); return () => {generation.current++;};}, [load]));

  const selectFile = async (slug: string) => {
    if (pickInFlight.current || saveInFlight.current) return;
    pickInFlight.current = true;
    try {
      const [file] = await pick({type: [types.images, types.pdf], allowMultiSelection: false});
      if (!file) return;
      const type = file.type || (/\.pdf$/i.test(file.name || '') ? 'application/pdf' : 'image/jpeg');
      validateDocumentFile({...file, type});
      setDrafts(previous => ({...previous, [slug]: {...previous[slug], file: {uri: file.uri, name: file.name || (type === 'application/pdf' ? 'document.pdf' : 'document.jpg'), type, size: file.size}}}));
    } catch (cause: any) {
      if (!(isErrorWithCode(cause) && cause.code === errorCodes.OPERATION_CANCELED)) Alert.alert('Document not selected', cause?.message || 'Please try again.');
    } finally {pickInFlight.current = false;}
  };

  const save = async () => {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    try {
      const changes = documentUpdates(definitions, records, drafts);
      if (!changes.length) return;
      const token = await getValue('token');
      if (!token) throw new Error('Please sign in again to update your documents.');
      setSaving(true);
      const form = new FormData();
      changes.forEach((change, index) => {
        form.append(`documents[${index}][slug]`, change.slug);
        if (change.file) form.append(`documents[${index}][file]`, {uri: change.file.uri, type: change.file.type, name: change.file.name} as any);
        if (change.expired_at) form.append(`documents[${index}][expired_at]`, change.expired_at);
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(`${URL}/api/update/document`, {method: 'POST', headers: {Accept: 'application/json', Authorization: `Bearer ${token}`}, body: form, signal: controller.signal});
        const body = await response.json();
        if (!response.ok || body?.success !== true) throw new Error(body?.message || 'The documents could not be saved.');
      } finally {clearTimeout(timeout);}
      setDrafts({}); await load(); dispatch(selfDriverData());
      notificationHelper('', 'Documents saved and sent for review.', 'success');
    } catch (cause: any) {Alert.alert('Documents not saved', cause?.name === 'AbortError' ? 'The upload timed out. Your selection is retained. Please try again.' : cause?.message || 'Please check your connection and try again.');}
    finally {saveInFlight.current = false; setSaving(false);}
  };

  const viewFile = async (value: string) => {
    const url = safeDocumentUrl(value);
    if (!url) return Alert.alert('Preview', 'Save this document before opening it in your browser.');
    try {await Linking.openURL(url);} catch {Alert.alert('Unable to open document', 'Please try again.');}
  };
  const selectedCount = Object.keys(drafts).length;
  const dateDefinition = definitions.find(item => item.slug === dateSlug);
  return <ReferenceScreen><View style={[[styles.root, {backgroundColor: colors.canvas}], {backgroundColor:'transparent'}]}>
    <Header title="Documents"/>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={brand.green} colors={[brand.green]}/>}>
      <View style={[styles.summary, {backgroundColor: colors.surface,borderColor:colors.border}]}><View style={styles.icon}><DesignIcon name="shield-check" width={32} height={32} color={colors.accent}/></View><Text style={[styles.heading, {color: colors.ink}]}>Your verification documents</Text><Text style={[styles.note,{color:colors.muted}]}>Upload clear JPG, PNG or PDF files up to {DOCUMENT_MAX_MB} MB each. Replacements are sent to Admin for review.</Text></View>
      {!!error && <View accessibilityRole="alert" style={styles.notice}><Text style={{color: colors.ink}}>{error}</Text><TouchableOpacity onPress={load} style={styles.action}><Text style={[styles.actionText,{color:colors.accent}]}>Try again</Text></TouchableOpacity></View>}
      {loading && !definitions.length && <BrandLoader color={colors.accent} style={{margin: 20}}/>}
      {!loading && !error && !definitions.length && <View style={[styles.card, {backgroundColor: colors.surface,borderColor:colors.border}]}><Text style={[styles.title, {color: colors.ink}]}>No document requirements configured</Text><Text style={[styles.note,{color:colors.muted}]}>Contact Dropa2z support if you need help with verification.</Text></View>}
      {definitions.map(definition => {
        const original = existingDocument(records, definition), draft = drafts[definition.slug];
        const expiry = draft?.expiry ?? documentDate(original?.expired_at);
        const uri = draft?.file?.uri || original?.document_image_url;
        const pdf = draft?.file ? draft.file.type === 'application/pdf' : /\.pdf(?:[?#]|$)/i.test(uri || '');
        const expired = !!expiry && expiry < localDocumentDate();
        const status = draft ? 'Not saved' : expired ? 'Expired' : original?.status === 'approved' ? 'Approved' : original?.status === 'rejected' ? 'Rejected' : original?.status === 'pending' ? 'Under review' : 'Not uploaded';
        const statusColor = status === 'Approved' ? brand.green : ['Rejected','Expired'].includes(status) ? '#B42318' : brand.muted;
        return <View key={definition.slug} style={[styles.card, {backgroundColor: colors.surface,borderColor:colors.border}]}>
          <View style={styles.row}><View style={{flex: 1}}><Text style={[styles.title, {color: colors.ink}]}>{definition.name}</Text><Text style={[styles.label,{color:colors.muted}]}>{definition.type === 'vehicle' ? 'Vehicle' : role === 'fleet_manager' ? 'Fleet' : 'Driver'} · {Number(definition.is_required) === 1 ? 'Required' : 'Optional'}</Text></View><Text style={[styles.status, {color: statusColor}]}>{status}</Text></View>
          {!!uri && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${definition.name}`} onPress={() => viewFile(uri)} style={[styles.preview,{backgroundColor:isDark?"#17191C":brand.canvas}]}>{pdf ? <><DesignIcon name="file-text" color={colors.accent} width={34} height={34}/><Text numberOfLines={2} style={[styles.filename,{color:colors.muted}]}>{draft?.file?.name || 'PDF document'}</Text></> : <Image source={{uri}} resizeMode="contain" style={styles.image}/>}</TouchableOpacity>}
          {!!original?.rejection_reason && <Text style={styles.rejected}>{original.rejection_reason}</Text>}
          <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={() => selectFile(definition.slug)} style={styles.action}><DesignIcon name="plus" color={colors.accent} width={18} height={18}/><Text style={[styles.actionText,{color:colors.accent}]}>{uri ? 'Replace document' : 'Choose document'}</Text></TouchableOpacity>
          {(Number(definition.need_expired_date) === 1 || !!expiry) && <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={() => setDateSlug(definition.slug)} style={styles.expiry}><Text style={{color: colors.ink}}>Expiry date</Text><Text style={[styles.actionText, {color:colors.accent}, expired && styles.rejected]}>{expiry || 'Select date'}</Text></TouchableOpacity>}
        </View>;
      })}
      <TouchableOpacity accessibilityRole="button" style={[styles.card, styles.row, {backgroundColor: colors.surface,borderColor:colors.border}]} onPress={() => navigation.navigate('LegalDocuments')}><DesignIcon name="file-text" color={colors.accent}/><Text style={[styles.title, {color: colors.ink, flex: 1, marginLeft: 12}]}>Policies & Documents</Text><DesignIcon name="arrow-right" color={brand.muted}/></TouchableOpacity>
      {!!selectedCount && <Text style={[styles.note,{color:colors.muted}]}>Unsaved changes: {selectedCount} document{selectedCount === 1 ? '' : 's'}.</Text>}
    </ScrollView>
    {!!selectedCount && <View style={[styles.footer, {backgroundColor: colors.surface, paddingBottom: Math.max(14, insets.bottom)}]}><Button title="Save documents" onPress={save} backgroundColor={brand.green} color="#FFFFFF" loading={saving}/></View>}
    {!!dateDefinition && !!dateSlug && <DateTimePicker value={new Date((drafts[dateSlug]?.expiry || documentDate(existingDocument(records, dateDefinition)?.expired_at) || localDocumentDate()) + 'T12:00:00')} minimumDate={new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, date) => {const slug = dateSlug; setDateSlug(null); if (event.type === 'set' && date) setDrafts(previous => ({...previous, [slug]: {...previous[slug], expiry: localDocumentDate(date)}}));}}/>}
  </View></ReferenceScreen>;
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:20,paddingBottom:28},summary:{padding:22,borderRadius:20,marginBottom:20},heading:{fontSize:23,fontWeight:'700',color:brand.ink,marginTop:14},note:{fontSize:13,lineHeight:20,color:brand.muted,marginTop:8},icon:{width:58,height:58,borderRadius:16,backgroundColor:brand.greenSoft,alignItems:'center',justifyContent:'center'},notice:{padding:16,borderRadius:16,borderWidth:1,borderColor:brand.border,marginBottom:16},card:{padding:18,borderRadius:18,borderWidth:1,borderColor:brand.border,marginBottom:14},row:{flexDirection:'row',alignItems:'center',gap:12},title:{fontSize:16,fontWeight:'700',flexShrink:1},label:{color:brand.muted,fontSize:12,marginTop:6},status:{fontSize:12,fontWeight:'600',maxWidth:100,textAlign:'right'},preview:{height:148,borderRadius:12,backgroundColor:brand.canvas,alignItems:'center',justifyContent:'center',marginTop:16,overflow:'hidden'},image:{width:'100%',height:'100%'},filename:{fontSize:13,color:brand.muted,marginTop:8,paddingHorizontal:12},action:{minHeight:48,flexDirection:'row',gap:8,alignItems:'center',marginTop:12},actionText:{color:brand.green,fontSize:14,fontWeight:'700'},expiry:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,minHeight:48,borderTopWidth:1,borderTopColor:brand.border},rejected:{color:'#B42318',fontSize:12,marginTop:6},footer:{paddingTop:14,borderTopWidth:1,borderTopColor:brand.border}});
