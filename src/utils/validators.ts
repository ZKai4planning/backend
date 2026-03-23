import { validatePhone } from "./PhoneNumberValidator.util";

export const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isValidPhone = (value: string) => {
  return /^\+44\d{10}$/.test(value);
};

export const isValidInternationalPhone = (value: string) => {
  return /^\+?[1-9]\d{7,14}$/.test(value.trim());
};

export const isValidIndianPhone = (value: string) => {
  const phone = value.replace(/\s/g, "");
  return /^\+91[6-9]\d{9}$/.test(phone);
};

export const isValidIndiaUKPhoneNumber = (value: string) => {
  return validatePhone("IN", value).valid || validatePhone("GB", value).valid;
};

export const normalizeEmail = (value?: string | null) => {
  return typeof value === "string" ? value.trim().toLowerCase() : undefined;
};

export const normalizePhone = (value?: string | null) => {
  return typeof value === "string" ? value.trim() : undefined;
};

export const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export const isValidName = (name: string): boolean => {
  const nameRegex = /^[A-Za-z ]{2,50}$/;
  return nameRegex.test(name.trim());
};
export const isValidPassword = (password: string): boolean => {
  // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}


export const validatePasswordPolicy = (password: string) => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one digit");
  }

  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
