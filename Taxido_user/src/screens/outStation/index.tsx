import React,{useEffect} from 'react';
import {useRoute} from '@react-navigation/native';
import {useAppNavigation} from '../../utils/navigation';
export function Outstation(){const route=useRoute();const navigation=useAppNavigation();useEffect(()=>{navigation.replace('BookRide',route.params as any);},[navigation,route.params]);return null;}
