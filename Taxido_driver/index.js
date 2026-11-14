/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { TextDecoder, TextEncoder } from 'text-encoding';
import { AppRegistry, LogBox } from 'react-native'
import { name as appName } from './app.json'

// Firebase packages expect these Web APIs, but Hermes on Android does not
// expose them by default.
globalThis.TextDecoder = globalThis.TextDecoder || TextDecoder;
globalThis.TextEncoder = globalThis.TextEncoder || TextEncoder;

const App = require('./App').default;

LogBox.ignoreAllLogs()
AppRegistry.registerComponent(appName, () => App)
