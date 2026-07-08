export const sendVerificationEmail = async (
  email: string,
  rawtoken: string,
): Promise<void> => {
  // Mock implementation to avoid TS "is not a module" errors while email validation is temporarily commented/unused.
  console.log(`[MOCK EMAIL VERIFICATION] Verification email requested for ${email} with token: ${rawtoken}`);
  return Promise.resolve();
};
