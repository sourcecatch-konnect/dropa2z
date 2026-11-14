import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { windowHeight } from '../../theme/appConstant'
import React, { useMemo, useCallback, useState } from 'react'
import {ReferenceIcon} from '../../design/ReferenceChrome'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Home } from '../../screen/home'
import { MyRide, Settings } from '../../screen'
import {TouchableOpacity, Vibration} from 'react-native';
import {Text} from '../../design/Typography';
import appColors from '../../theme/appColors'
import Icons from '../../utils/icons/icons'
import styles from './styles'
import { useSelector } from 'react-redux'
import { useValues } from '../../utils/context'
import { DashBoard } from '../../screen/dashBoard'
import { FleetDashBoard, FleetHome } from '../../screen/fleet'
import { useTabGuard } from '../../utils/hooks'
import {DriverTraining} from '../../screen/driverTraining'

const Tab = createBottomTabNavigator()

const TabLabel = React.memo(({ focused, label, rtl, reference, dark }: { focused: boolean; label: string; rtl: boolean;reference:boolean;dark:boolean }) => (
  <Text
    style={[
      styles.tabBarLabelStyle,
      {
        color: reference ? focused?(dark?'#FFBE60':'#A64B00'):dark?'#FFFFFF':'#333333' : focused ? appColors.white : appColors.categoryTitle,
        textAlign: rtl ? 'right' : 'left',
        writingDirection: rtl ? 'rtl' : 'ltr',
      },
    ]}
  >
    {label}
  </Text>
))

const TabIcon = React.memo(({ Icon, focused }: { Icon: any; focused: boolean }) => (
  <Icon color={focused ? appColors.white : appColors.categoryTitle} />
))

export default function App() {
  const [activeTab,setActiveTab]=useState('Home')
  const referenceTabs=true
  const insets = useSafeAreaInsets()
  const { translateData } = useSelector((state: any) => state.setting)
  const { rtl, isDark } = useValues()
  const { selfDriver } = useSelector((state: any) => state.account)

  const defaultTranslations = useMemo(() => ({
    home: 'Home',
    activeRide: 'DashBoard',
    myRide: 'My Delivery',
    settings: 'Settings',
  }), [])

  const t = translateData || defaultTranslations
  const type = selfDriver?.role

  const screens = useMemo(() => {
    return type !== 'fleet_manager'
      ? [
        {
          name: 'Home',
          component: Home,
          icon: Icons.Home,
          label: t.home,
        },
        {
          name: 'DashBoard',
          component: DashBoard,
          icon: Icons.DashBoard,
          label: translateData?.dashboard,
        },
        {
          name: 'My Delivery',
          component: MyRide,
          icon: Icons.Car,
          label: t.myRide,
        },
        {
          name: 'Settings',
          component: Settings,
          icon: Icons.Setting,
          label: t.settings,
        },
      ]
      : [
        {
          name: 'Home',
          component: FleetHome,
          icon: Icons.Home,
          label: t.home,
        },
        {
          name: 'DashBoard',
          component: DashBoard,
          icon: Icons.DashBoard,
          label: translateData?.dashboard,
        },
        {
          name: 'FleetDashBoard',
          component: FleetDashBoard,
          icon: Icons.DriverTab,
          label: translateData?.drivers,
        },
        {
          name: 'Settings',
          component: Settings,
          icon: Icons.Setting,
          label: t.settings,
        },
      ]
  }, [type, t.home, t.myRide, t.settings, translateData?.dashboard])

  // Memoize ordered screens to prevent unnecessary array operations
  const orderedScreens = useMemo(() => {
    return rtl ? [...screens].reverse() : screens
  }, [rtl, screens])

  const { guardedPress } = useTabGuard(400); // 400ms guard specifically for SAME TAB re-clicking

  // Vibration and Navigation handler
  const handleTabPress = useCallback((name: string, onPress: () => void, isSelected: boolean) => {
    // If user is already on the tab, block spamming/refreshing too fast
    if (isSelected) {
      guardedPress(`${name}_selected`, () => {
        Vibration.vibrate(20);
        onPress(); // This triggers "scroll to top" or "refresh" logic
      });
      return;
    }

    // ALWAYS allow switching to a DIFFERENT tab instantly for zero lag
    Vibration.vibrate(42);
    onPress();
  }, [guardedPress]);


  // Memoize screen options to prevent recreation on every render
  const screenOptions = useMemo(() => ({
    tabBarStyle: [styles.tabBarContainer, {
      backgroundColor:referenceTabs?(isDark?'#17191C':'#FFFFFF'):appColors.primaryFont,
      height: windowHeight(8.9) + insets.bottom,
      paddingBottom: windowHeight(1.3) + insets.bottom,
    }],
    headerShown: false,
  }), [insets.bottom,referenceTabs,isDark])

  if(type==='driver'&&Number(selfDriver?.is_verified)===1&&selfDriver?.training?.required) return <DriverTraining/>;
  return (
    <Tab.Navigator
      initialRouteName='Home'
      screenListeners={{state:(event:any)=>{const state=event.data?.state;if(state?.routes?.[state.index])setActiveTab(state.routes[state.index].name)}}}
      detachInactiveScreens={false}
      screenOptions={screenOptions}
    >
      {orderedScreens.map(({ name, component, icon: Icon, label }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            unmountOnBlur: false,
            lazy: true,
            tabBarIcon: ({ focused }) => referenceTabs ? <ReferenceIcon name={name==='Home'?'home':name==='DashBoard'?'services':name==='Settings'?'settings':'package'} color={focused?(isDark?'#FFBE60':'#A64B00'):isDark?'#FFFFFF':'#333333'}/> : <TabIcon Icon={Icon} focused={focused} />,
            tabBarButton: (props: any) => (
              <TouchableOpacity
                {...props}
                onPress={() => handleTabPress(name, props.onPress, props.accessibilityState?.selected)}
              />
            ),
            tabBarLabel: ({ focused }) => <TabLabel focused={focused} label={label} rtl={rtl} reference={referenceTabs} dark={isDark}/>,
          }}
        />
      ))}
    </Tab.Navigator>
  )
}

