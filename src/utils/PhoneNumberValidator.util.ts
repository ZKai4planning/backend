import {
  parsePhoneNumberFromString,
  CountryCode,
} from "libphonenumber-js";

type ValidationResult = {
  valid: boolean;
  country?: string;
  number?: string; // E.164 format
  national?: string;
  error?: string;
};

type EmployeeRegion = "in" | "uk";

const REGION_TO_COUNTRY_CODE: Record<EmployeeRegion, CountryCode> = {
  in: "IN",
  uk: "GB",
};

const ALLOWED_PHONE_CHARACTERS_REGEX = /^[+\d\s\-()]+$/;
const UK_MOBILE_REGEX = /^(?:\+44|0)7\d{9}$/;
const UK_MOBILE_NO_PREFIX_REGEX = /^7\d{9}$/;
const UK_LANDLINE_REGEX = /^(?:\+44|0)[123]\d{9}$/;
const INDIA_MOBILE_REGEX = /^(?:\+91|0)[6-9]\d{9}$/;
const INDIA_MOBILE_NO_PREFIX_REGEX = /^[6-9]\d{9}$/;
const INDIA_LANDLINE_REGEX = /^(?:\+91|0)[1-5]\d{7,11}$/;
const INDIA_LANDLINE_NO_PREFIX_REGEX = /^[1-5]\d{7,11}$/;

const stripFormattingCharacters = (phone: string) => phone.replace(/[\s\-()]/g, "");

const normalizePhoneInput = (phone: string) => {
  const trimmedPhone = phone.trim();

  if (!ALLOWED_PHONE_CHARACTERS_REGEX.test(trimmedPhone)) {
    return null;
  }

  if (trimmedPhone.startsWith("+")) {
    return `+${stripFormattingCharacters(trimmedPhone.slice(1))}`;
  }

  return stripFormattingCharacters(trimmedPhone);
};

const normalizeUkPhoneNumber = (phone: string) => {
  if (UK_MOBILE_REGEX.test(phone) || UK_LANDLINE_REGEX.test(phone)) {
    return phone.startsWith("+44") ? phone : `+44${phone.slice(1)}`;
  }

  if (UK_MOBILE_NO_PREFIX_REGEX.test(phone)) {
    return `+44${phone}`;
  }

  return null;
};

const normalizeIndianPhoneNumber = (phone: string) => {
  if (INDIA_MOBILE_REGEX.test(phone)) {
    if (phone.startsWith("+91")) {
      return phone;
    }

    return `+91${phone.slice(1)}`;
  }

  if (INDIA_MOBILE_NO_PREFIX_REGEX.test(phone)) {
    return `+91${phone}`;
  }

  if (INDIA_LANDLINE_REGEX.test(phone)) {
    if (phone.startsWith("+91")) {
      return phone;
    }

    return `+91${phone.slice(1)}`;
  }

  if (INDIA_LANDLINE_NO_PREFIX_REGEX.test(phone)) {
    return `+91${phone}`;
  }

  return null;
};

const normalizeRegionPhoneNumber = (region: EmployeeRegion, phone: string) => {
  if (region === "uk") {
    return normalizeUkPhoneNumber(phone);
  }

  if (region === "in") {
    return normalizeIndianPhoneNumber(phone);
  }

  return null;
};

export function validatePhone(
  countryInput: string,
  phone: string
): ValidationResult {
  try {
    if (!countryInput || !phone) {
      return { valid: false, error: "Missing input" };
    }

    const cleanedPhone = normalizePhoneInput(phone);
    const cleanedCountry = countryInput.trim();

    if (!cleanedPhone) {
      return { valid: false, error: "Invalid phone format" };
    }

    let parsed;

    // Case 1: ISO country code (IN, GB)
    if (/^[A-Z]{2}$/i.test(cleanedCountry)) {
      const countryCode = cleanedCountry.toUpperCase() as CountryCode;
      parsed = cleanedPhone.startsWith("+")
        ? parsePhoneNumberFromString(cleanedPhone)
        : parsePhoneNumberFromString(cleanedPhone, countryCode);

      if (!parsed || parsed.country !== countryCode || !parsed.isValid()) {
        return { valid: false, error: "Invalid phone number" };
      }
    }
    // Case 2: country calling code (+91, +44)
    else if (/^\+\d+$/.test(cleanedCountry)) {
      const fullNumber = cleanedPhone.startsWith("+")
        ? cleanedPhone
        : `${cleanedCountry}${cleanedPhone}`;

      parsed = parsePhoneNumberFromString(fullNumber);

      if (!parsed || !parsed.isValid()) {
        return { valid: false, error: "Invalid phone number" };
      }

      const expectedCallingCode = cleanedCountry.replace("+", "");
      if (parsed.countryCallingCode !== expectedCallingCode) {
        return { valid: false, error: "Invalid phone number" };
      }
    } else {
      return { valid: false, error: "Invalid country input" };
    }

    return {
      valid: true,
      country: parsed.country,
      number: parsed.number,
      national: parsed.nationalNumber,
    };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}

export function validateEmployeeRegionPhone(
  region: EmployeeRegion,
  phone: string
): ValidationResult {
  const countryCode = REGION_TO_COUNTRY_CODE[region];

  if (!countryCode) {
    return { valid: false, error: "Unsupported employee region" };
  }

  const cleanedPhone = normalizePhoneInput(phone);

  if (!cleanedPhone) {
    return { valid: false, error: "Invalid phone format" };
  }

  const normalizedPhone = normalizeRegionPhoneNumber(region, cleanedPhone);

  if (!normalizedPhone) {
    return {
      valid: false,
      error:
        region === "uk"
          ? "Invalid UK phone format"
          : "Invalid Indian phone format",
    };
  }

  return validatePhone(countryCode, normalizedPhone);
}

/**
 Usage
*/
// import { validatePhone } from '@/utils/PhoneNumberValidator.util';

// const result = validateEmployeeRegionPhone("in", "9876543210");

// if (!result.valid) {
//   console.log(result.error);
// } else {
//   console.log(result.number); // +919876543210
// }
