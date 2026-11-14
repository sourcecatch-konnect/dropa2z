import {BrandLoader} from './BrandLogo';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Text} from './Typography';
import {ReferenceLogo} from './ReferenceChrome';
import {DesignIcon} from './DesignIcon';
import {brand} from './tokens';
import {PolicyLink, publishedPolicyLinks} from './policyLinks';

export function LegalDocumentsPanel({header, setting, mode, site, dark = false, policyKind}: {header: React.ReactNode; setting: any; mode: 'rider' | 'driver'; site: string; dark?: boolean; policyKind?: 'terms' | 'privacy'}) {
  const [links, setLinks] = useState<PolicyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const request = useRef<AbortController | null>(null);
  const opening = useRef(false);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    setLoading(true); setError('');
    try {
      const response = await fetch(site + '/api/page?status=1&paginate=100', {headers: {Accept: 'application/json'}, signal: controller.signal});
      const body = await response.json();
      if (!response.ok || !Array.isArray(body?.data)) throw new Error('Published documents could not be loaded.');
      if (mounted.current && !controller.signal.aborted) setLinks(publishedPolicyLinks(body.data, setting, mode, site));
    } catch (cause: any) {
      if (mounted.current && request.current === controller) {
        setLinks(publishedPolicyLinks([], setting, mode, site));
        setError(controller.signal.aborted ? 'The connection timed out. Please try again.' : cause?.message || 'Unable to load documents.');
      }
    } finally {clearTimeout(timer); if (mounted.current && request.current === controller) setLoading(false);}
  }, [setting, mode, site]);
  useEffect(() => {mounted.current = true; load(); return () => {mounted.current = false; request.current?.abort();};}, [load]);
  const open = async (url: string) => {
    if (opening.current) return; opening.current = true;
    try {await Linking.openURL(url);} catch {Alert.alert('Unable to open document', 'Please try again or contact Dropa2z support.');} finally {opening.current = false;}
  };
  const visibleLinks = policyKind ? links.filter(item => policyKind === 'privacy' ? /privacy/i.test(item.title + ' ' + item.url) : /terms?|conditions?/i.test(item.title + ' ' + item.url)) : links;
  const title = policyKind === 'privacy' ? 'Privacy Policy' : policyKind === 'terms' ? 'Terms of Service' : 'Policies & documents';
  const ink = dark ? '#FFFFFF' : brand.ink, surface = dark ? '#25282D' : '#FFFFFF';
  const muted = dark ? '#BBC1CA' : brand.muted, line = dark ? '#41464E' : brand.border;
  const accent = dark ? '#FFBE60' : '#A64B00';
  return <View style={[styles.root, {backgroundColor: dark ? '#151719' : '#FAFBFC'}]}>
    {header}
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={brand.green} colors={[brand.green]}/>}>
      <View style={[styles.hero, {backgroundColor: surface}]}><ReferenceLogo width={140}/><Text style={[styles.heading, {color: ink}]}>{title}</Text><Text style={[styles.description, {color: muted}]}>Read the latest policies and delivery information published by Dropa2z.</Text></View>
      {loading && !links.length && <BrandLoader color={accent} style={{margin: 20}}/>}
      {!!error && <View accessibilityRole="alert" style={[styles.notice, {borderColor: line}]}><Text style={{color: ink}}>{error}</Text><TouchableOpacity onPress={load} style={styles.retry}><Text style={[styles.link, {color: accent}]}>Try again</Text></TouchableOpacity></View>}
      {visibleLinks.map(item => <TouchableOpacity key={item.key} accessibilityRole="link" onPress={() => open(item.url)} style={[styles.row, {backgroundColor: surface, borderColor: line}]}><View style={[styles.icon, {backgroundColor: dark ? "#3B2B19" : "#FFF2DF"}]}><DesignIcon name="file-text" color={accent}/></View><Text style={[styles.title, {color: ink}]}>{item.title}</Text><DesignIcon name="arrow-right" color={muted} width={20} height={20}/></TouchableOpacity>)}
      {!loading && !visibleLinks.length && !error && <View style={[styles.hero, {backgroundColor: surface}]}><DesignIcon name="file-text" width={36} height={36} color={accent}/><Text style={[styles.title, {color: ink, marginTop: 12}]}>No policy published yet</Text><Text style={[styles.description, {color: muted}]}>Please contact Dropa2z support if you need a policy before booking.</Text></View>}
      <Text style={[styles.footnote, {color: muted}]}>Documents open in your browser. Pull down to refresh the latest published list.</Text>
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:20,paddingBottom:40},hero:{padding:22,borderRadius:20,alignItems:'center',marginBottom:20},heading:{fontSize:23,fontWeight:'700',marginTop:24,textAlign:'center'},description:{fontSize:14,lineHeight:21,color:brand.muted,textAlign:'center',marginTop:10},row:{flexDirection:'row',alignItems:'center',padding:16,borderRadius:16,borderWidth:1,borderColor:brand.border,marginBottom:12,minHeight:72},icon:{padding:10,backgroundColor:brand.greenSoft,borderRadius:12,marginRight:14},title:{fontSize:16,fontWeight:'600',flexShrink:1,flex:1},notice:{padding:16,borderWidth:1,borderColor:brand.border,borderRadius:16,marginBottom:16},retry:{paddingVertical:12},link:{fontWeight:'700',color:brand.green},footnote:{fontSize:12,color:brand.muted,lineHeight:18,marginTop:12}});
