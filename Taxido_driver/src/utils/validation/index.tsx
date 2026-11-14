export const ValidatePhoneNumber = (phone: string, t?: Function, countryCode = '91') => {
  const cleanPhone = phone.replace(/[^\d]/g, "");

  if (!phone) {
    return t?.("error.phoneNo") || "Phone Number is Required";
  }
  if (countryCode.replace('+', '') === '91' && !/^[6-9]\d{9}$/.test(phone.trim())) {
    return 'Enter a valid 10-digit Indian mobile number.';
  }

  if (cleanPhone?.length < 6) {
    return "Phone Number must be at Least 6 Digits";
  }

  if (cleanPhone?.length > 15) {
    return "Phone Number must be 15 Digits";
  }
  const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{6,15}$/;
  if (!phoneRegex.test(phone)) {
    return "Invalid Phone Number Format";
  }

  return "";
};

export const validateEmail = (value: string, t?: Function) => {
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!value) {
    return 'Please Enter Email';
  } else if (!emailRegex.test(value)) {
    return 'Please Enter Valid Email';
  }
  return "";
};

export const validateName = (value: string) => {
  const name = value.trim();
  return name.length <= 80 && (name.match(/\p{L}/gu)?.length ?? 0) >= 2 &&
    /^[\p{L}\p{M}][\p{L}\p{M}\s.'’\-]*$/u.test(name)
    ? '' : 'Enter your name using letters, spaces, apostrophes, or hyphens.';
};

export const validateVehicleNumber = (value: string) => {
  const message = 'Enter a valid vehicle registration number, for example MH19AB1234.';
  if (!/^[A-Za-z0-9 -]+$/.test(value)) return message;
  return /^(?:[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}|\d{2}BH\d{4}[A-Z]{1,2})$/.test(value.replace(/[ -]/g, '').toUpperCase()) ? '' : message;
};
