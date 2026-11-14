import {useKeyboardState} from '../../../utils/useKeyboardState';
import React, { useEffect, useRef, useState } from 'react'
import { BackHandler, Keyboard, ScrollView, View } from 'react-native'
import styles from './styles'
import { Background, Header } from '../component'
import OtpView from './component/otpView'
import appColors from '../../../theme/appColors'
import { useValues } from '../../../utils/context'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function Otp() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const rootRef = useRef<View>(null)
  const {top:keyboardTop}=useKeyboardState();
  const [rootFrame, setRootFrame] = useState({ top: 0, height: 0 })
  const keyboardVisible = keyboardTop !== null
  const availableHeight = keyboardTop === null || !rootFrame.height
    ? undefined : Math.max(0, Math.min(rootFrame.height, keyboardTop - rootFrame.top))

  
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const { isDark } = useValues()
  return (
    <View
      ref={rootRef}
      style={[styles.main, { backgroundColor: isDark ? appColors.darkThemeSub : appColors.white }]}
      onLayout={() => rootRef.current?.measureInWindow((_x, top, _width, height) => {
        setRootFrame(previous => previous.top === top && previous.height === height ? previous : { top, height })
      })}
    >
      <View style={availableHeight === undefined ? { flex: 1 } : { height: availableHeight }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingTop: keyboardVisible ? 12 : 0, paddingBottom: Math.max(16, insets.bottom) }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
      {!keyboardVisible && (
      <View
        style={[
          styles.background,
          {
            backgroundColor: isDark
              ? appColors.bgDark
              : appColors.graybackground,
          },
        ]}
      >
        <Header
          showBackButton={false}
          backgroundColor={isDark ? appColors.bgDark : appColors.graybackground}
        />
      </View>
      )}
      {!keyboardVisible && <Background />}
      <OtpView compact={keyboardVisible} />
      </ScrollView>
      </View>
    </View>
  )
}
