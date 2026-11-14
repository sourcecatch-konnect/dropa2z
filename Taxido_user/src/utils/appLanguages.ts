export type AppLanguage = {
  name: string;
  locale: 'en' | 'hi' | 'mr';
  app_locale: string;
  is_rtl: 0;
  status: 1;
  flagEmoji: string;
};

const requiredLanguages: AppLanguage[] = [
  {name: 'English', locale: 'en', app_locale: 'en_IN', is_rtl: 0, status: 1, flagEmoji: '🇮🇳'},
  {name: 'हिंदी', locale: 'hi', app_locale: 'hi_IN', is_rtl: 0, status: 1, flagEmoji: '🇮🇳'},
  {name: 'मराठी', locale: 'mr', app_locale: 'mr_IN', is_rtl: 0, status: 1, flagEmoji: '🇮🇳'},
];

export const appLanguages = (response: any) => {
  const serverLanguages = Array.isArray(response?.data) ? response.data : [];
  return {
    ...(response && typeof response === 'object' ? response : {}),
    data: requiredLanguages.map(language => {
      const serverLanguage = serverLanguages.find((item: any) => item?.locale === language.locale);
      return {...serverLanguage, ...language};
    }),
  };
};

const deliveryWords: Record<string, Record<string, string>> = {
  hi: {
    home: 'होम', services: 'सेवाएं', settings: 'सेटिंग्स', history: 'इतिहास', changeLanguage: 'भाषा बदलें',
    appSetting: 'ऐप सेटिंग्स', update: 'अपडेट करें', continue: 'आगे बढ़ें', cancel: 'रद्द करें', close: 'बंद करें',
    submit: 'सबमिट करें', accept: 'स्वीकार करें', pickupLocation: 'पिकअप लोकेशन', pickupLocationTittle: 'पिकअप लोकेशन',
    destination: 'ड्रॉप लोकेशन', enterDestination: 'ड्रॉप लोकेशन डालें', enterDestinationPlaceholderText: 'ड्रॉप लोकेशन डालें',
    chooseVehicle: 'वाहन चुनें', selectVehicleType: 'वाहन चुनें', bike: 'बाइक', auto: 'ऑटो', parcel: 'डिलीवरी',
    weight: 'वज़न', payment: 'पेमेंट', cash: 'कैश', bookRide: 'डिलीवरी बुक करें', proceed: 'आगे बढ़ें',
    findingDriver: 'ड्राइवर खोज रहे हैं', driver: 'ड्राइवर', active: 'चालू', activeRideHeader: 'चालू डिलीवरी',
    completed: 'पूरा हुआ', cancelRide: 'डिलीवरी रद्द करें', myRide: 'डिलीवरी', notification: 'नोटिफिकेशन',
    chatwithstaff: 'सपोर्ट से बात करें', typeHere: 'मैसेज लिखें...', send: 'भेजें', retry: 'फिर से कोशिश करें',
  },
  mr: {
    home: 'होम', services: 'सेवा', settings: 'सेटिंग्ज', history: 'इतिहास', changeLanguage: 'भाषा बदला',
    appSetting: 'अॅप सेटिंग्ज', update: 'अपडेट करा', continue: 'पुढे जा', cancel: 'रद्द करा', close: 'बंद करा',
    submit: 'सबमिट करा', accept: 'स्वीकारा', pickupLocation: 'पिकअप ठिकाण', pickupLocationTittle: 'पिकअप ठिकाण',
    destination: 'ड्रॉप ठिकाण', enterDestination: 'ड्रॉप ठिकाण टाका', enterDestinationPlaceholderText: 'ड्रॉप ठिकाण टाका',
    chooseVehicle: 'वाहन निवडा', selectVehicleType: 'वाहन निवडा', bike: 'बाईक', auto: 'रिक्षा', parcel: 'डिलिव्हरी',
    weight: 'वजन', payment: 'पेमेंट', cash: 'रोख', bookRide: 'डिलिव्हरी बुक करा', proceed: 'पुढे जा',
    findingDriver: 'ड्रायव्हर शोधत आहोत', driver: 'ड्रायव्हर', active: 'सुरू', activeRideHeader: 'चालू डिलिव्हरी',
    completed: 'पूर्ण', cancelRide: 'डिलिव्हरी रद्द करा', myRide: 'डिलिव्हरी', notification: 'सूचना',
    chatwithstaff: 'सपोर्टशी बोला', typeHere: 'मेसेज लिहा...', send: 'पाठवा', retry: 'पुन्हा प्रयत्न करा',
  },
};

export const localizedDeliveryCopy = (source: any, locale?: string | null) => {
  let base = source;
  if (typeof source === 'string') {
    try { base = JSON.parse(source); } catch { base = {}; }
  }
  return {...(base && typeof base === 'object' ? base : {}), ...(deliveryWords[locale || 'en'] || {})};
};
