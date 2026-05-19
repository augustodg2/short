import * as authService from "../../modules/auth/auth.service.js";

const defaultUser = {
  email: "user@example.com",
  password: "Password@123",
};

export async function createUserAndLogin(userOverrides?: {
  email?: string;
  password?: string;
}) {
  const userInput = {
    ...defaultUser,
    ...userOverrides,
  };

  const user = await authService.createUser(userInput);

  const tokens = await authService.generateTokens(user);

  return {
    ...tokens,
    ...user,
  };
}
