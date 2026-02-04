export const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isValidPhone = (value: string) => {
  return /^[6-9]\d{9}$/.test(value); // Indian phone validation
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