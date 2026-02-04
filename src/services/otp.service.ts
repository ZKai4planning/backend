const otpStore = new Map<string, string>();

export const saveOtp = (email: string, otp: string) => {
  otpStore.set(email, otp);

  setTimeout(() => otpStore.delete(email), 5 * 60 * 1000);
};

export const verifyOtp = (email: string, otp: string) => {
  return otpStore.get(email) === otp;
};
