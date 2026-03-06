export const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isValidPhone = (value: string) => {
  return /^\+44\d{10}$/.test(value);
};

export const isValidInternationalPhone = (value: string) => {
  return /^\+?[1-9]\d{7,14}$/.test(value.trim());
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
