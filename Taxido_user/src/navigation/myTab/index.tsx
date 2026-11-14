import React, {useState} from "react";
import {ReferenceIcon} from '../../design/ReferenceChrome';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BookingActivityCard} from '../../components/homeScreen/BookingActivityCard';
import { BottomTabBar, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "../../screens/homeScreen/home/index";
import {
  Category,
  HistoryEmpty,
  HistoryFill,
  Home,
  HomeLight,
  Setting,
  SettingPrimary,
} from "@utils/icons";
import { ProfileSetting } from "../../screens/bottomTab/profileTab/profileSetting/index";
import { RideScreen } from "../../screens/bottomTab/myRide/RideScreen/index";
import { CategoryScreen } from "../../screens/bottomTab/category/categoryScreen/index";
import { appColors, windowHeight } from "@src/themes";
import {TouchableOpacity, Vibration, View} from 'react-native';
import {Text} from '../../design/Typography';
import { useValues } from "@src/utils/context/index";
import styles from "./styles";
import { useSelector } from "react-redux";
import useTabGuard from "../../utils/hooks/useTabGuard";

const Tab = createBottomTabNavigator();

export function MyTabs() {
  const [activeTab,setActiveTab]=useState('HomeScreen');
  const referenceTabs=true;
  const insets=useSafeAreaInsets();
  const { translateData } = useSelector((state: any) => state.setting);
  const { isDark, isRTL } = useValues();
  const { guardedPress } = useTabGuard();
  const screens = [
    {
      name: "HomeScreen",
      component: HomeScreen,
      label: translateData?.home,
      icon: ({ focused }: any) =>
        focused ? (
          <Home colors={appColors.primary} width={24} height={24} />
        ) : (
          <HomeLight />
        ),
    },
    {
      name: "CategoryScreen",
      component: CategoryScreen,
      label: translateData?.services,
      icon: ({ focused }: any) =>
        focused ? (
          <Category fill={appColors.primary} colors={appColors.primary} />
        ) : (
          <Category colors={appColors.regularText} />
        ),
    },
    {
      name: "RideScreen",
      component: RideScreen,
      label: translateData?.history,
      icon: ({ focused }: any) =>
        focused ? <HistoryFill /> : <HistoryEmpty />,
    },
    {
      name: "Profile",
      component: ProfileSetting,
      label: translateData?.setting,
      icon: ({ focused }: any) =>
        focused ? (
          <SettingPrimary />
        ) : (
          <Setting colors={appColors.regularText} />
        ),
    },
  ];

  const orderedScreens = isRTL ? [...screens].reverse() : screens;

  return (
    <View
      style={{
        ...styles.flex,
        backgroundColor: isDark ? appColors.primaryText : appColors.lightGray,
      }}
    >
      <Tab.Navigator
        tabBar={props=><View>{props.state.routes[props.state.index]?.name==='HomeScreen'&&<BookingActivityCard dock/>}<BottomTabBar {...props}/></View>}
        initialRouteName="HomeScreen"
        screenListeners={{state:(event:any)=>{const state=event.data?.state;if(state?.routes?.[state.index])setActiveTab(state.routes[state.index].name);}}}
        screenOptions={{
          lazy: true,
          tabBarStyle: {
            ...styles.tabBar,
            height:68+insets.bottom,
            paddingTop:8,
            paddingBottom:8+insets.bottom,
            borderTopColor: isDark
              ? appColors.primaryText
              : appColors.lightGray,
            backgroundColor: isDark
              ? appColors.darkHeader
              : appColors.whiteColor,
            borderTopRightRadius: windowHeight(20),
            borderTopLeftRadius: windowHeight(20),
          },
          headerShown: false,
        }}
      >
        {orderedScreens.map(({ name, component, label, icon }) => (
          <Tab.Screen
            key={name}
            name={name}
            component={component}
            options={{
              tabBarLabel: ({ focused }) => (
                <Text
                  style={[
                    styles.text,
                    {
                      color: focused
                        ? isDark ? '#FFBE60' : '#B56700'
                        : isDark ? '#BBC1CA' : appColors.regularText,
                      textAlign: isRTL ? "right" : "left",
                      writingDirection: isRTL ? "rtl" : "ltr",
                    },
                  ]}
                >
                  {label}
                </Text>
              ),
              tabBarIcon: ({focused})=><ReferenceIcon name={name==='HomeScreen'?'home':name==='CategoryScreen'?'services':name==='RideScreen'?'package':'settings'} color={focused?(isDark?'#FFBE60':'#B56700'):isDark?'#BBC1CA':'#333333'}/>,
              tabBarButton: (props: any) => (
                <TouchableOpacity
                  {...props}
                  style={[props.style,{marginHorizontal:4,borderRadius:14},props.accessibilityState?.selected&&{backgroundColor:isDark?'#392C18':'#FFF5E5'}]}
                  onPress={() => {
                    guardedPress(name, () => {
                      Vibration.vibrate(42);
                      props.onPress?.();
                    });
                  }}
                />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
}
