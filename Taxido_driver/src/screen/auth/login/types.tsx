interface LoginViewProps {
  googleLogin?: () => void
  googleLoading?: boolean
  selectedRole?: 'driver' | 'fleet' | null
  setSelectedRole?: (role: 'driver' | 'fleet') => void
  showRoleSelector?: boolean
  appleLogin?: () => void
  gotoOTP: any
  gotoRegistration?: () => void
  phoneNumber: string
  setPhoneNumber: (value: string) => void;
  countryCode?: string
  setCountryCode?: (value: string) => void;
  demouser?: any
  gotoOTPFleet?: any
  setDemouser?: any
  fleetLoading?: boolean;
  driverLoading?: boolean;
  setFleetLoading?: (value: boolean) => void;
  setDriverLoading: any;

  borderColor?: any;
  setCca2?: any;
  email?: string;
  setEmail?: any

}
export default LoginViewProps
