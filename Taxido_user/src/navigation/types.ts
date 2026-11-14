

export type AddLocationDetailsProps = {
  userName: string;
  countryCode: string;
  phoneNumber: number;
  email: string;
  referralID: string;
};

export type ticketDataProps = {
  value: number | any;
};

export type OtpVerificationParams = {

  countryCode?: string;
  phoneNumber?: string;
  demouser?: boolean;

};

export type SignUpParams = {
  countryCode?: string,
  phoneNumber?: string,
  cca2?: string,
  verificationToken?: string,
}

export type ChooseRiderScreen = {
  destination: string;
  stops?: any[];
  pickupLocation: string;
  service_ID: string | number;
  zoneValue: string | number;
  scheduleDate: string;
  service_category_ID: string | number;
  selectedImage?: string;
  parcelWeight?: string | number;
  pickupCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
};

export type RideActive = {
  activeRideOTP: any;
  filteredLocations?: any[];
}

export type PromoCodeScreen = {
  from: "payment" | "wallet" | string;
  getCoupon: (coupon: any) => void;
};


export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  OtpVerification: OtpVerificationParams;
  SignUp: SignUpParams;
  AddNewLocation: undefined;
  Notifications: undefined;
  EmptyNotification: undefined;
  HomeScreen: undefined;
  DateTimeSchedule: undefined;
  ProfileSetting: undefined;
  EditProfile: undefined;
  PromoCodeScreen: PromoCodeScreen;
  BankDetail: undefined;
  SavedLocation: undefined;
  MyTabs: any;
  AppPageScreen: undefined;
  Documents: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  CompleteRideScreen: undefined;
  CancelRideScreen: undefined;
  PendingRideScreen: undefined;
  SelectRide: undefined;
  DriverDetails: undefined;
  FindingDriver: undefined;
  Onboarding: undefined;
  OutStation: undefined;
  LocationDrop: undefined;
  Delivery: Record<string, any>;
  ChooseRider: undefined;
  BookRide: Record<string, any>;
  CancelRide: undefined;
  CancelFare: undefined;
  AddNewRider: undefined;
  OnTheWayDetails: undefined;
  DriverInfos: {driverInfo?: any; rideInfo?: any} | undefined;
  ChatScreen: {driverId?:string|number;riderId?:string|number;rideId?:string|number;driverName?:string;driverImage?:string;from?:string} | undefined;
  RideActive: RideActive;
  Payment: undefined;
  Calander: undefined;
  Share: undefined;
  OtpVerify: undefined;
  ResetPassword: undefined;
  SignInWithMail: undefined;
  AddLocationDetails: undefined | AddLocationDetailsProps;
  CompleteRide: undefined;
  LocationSelect: undefined;
  ActiveRideScreen: undefined;
  ScheduleRideScreen: undefined;
  Rental: undefined;
  Outstation: undefined;
  Ride: undefined;
  ChooseRiderScreen: ChooseRiderScreen;
  PaymentRental: undefined;
  Wallet: undefined;
  PaymentMethod: undefined;
  PromoCodeDetail: undefined;
  AddLocation: undefined;
  TopUpWallet: undefined;
  HomeService: undefined;
  PaymentWebView: undefined;
  RentalLocation: undefined;
  RentalLocationSearch: undefined;
  LocationSave: undefined;
  RentalBooking: undefined;
  RentalVehicleSelect: undefined;
  CreateTicket: undefined;
  SupportTicket: undefined;
  TicketDetails: undefined | ticketDataProps;
  RentalCarDetails: undefined;
  Profile: undefined;
  NoService: undefined;
  NoInternet: any;
  AmbulanceSearch: undefined;
  BookAmbulance: undefined;
  AmbulancePayment: undefined;
  CarpoolingHome: undefined;
  PublishRide: undefined;
  AddVehicle: undefined;
  FindDriverHome: undefined;
  OneWaySelect: undefined;
  OneWayRideDetails: undefined;
  OneWayDaily: undefined;
  AmbulanceHome: undefined;
  PdfViewer: undefined;
  NoInternalServer: undefined
  ReferralList: undefined
  ReferralID: undefined;
  RideMapView: { rideData: any };
  DriverRequestScreen: undefined;
  DriverRequestDetailsScreen: { item: any };
};
