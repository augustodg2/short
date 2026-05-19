import { LoginInput, RegisterUserInput } from "./auth.schema.js";
import { Tokens } from "./auth.types.js";
import * as usersService from "./users.service.js";
import * as tokensService from "./tokens.service.js";

export async function refresh(refreshToken: string): Promise<Tokens> {
  return tokensService.rotateTokens(refreshToken);
}

export async function register(input: RegisterUserInput): Promise<Tokens> {
  const user = await usersService.create(input);

  return tokensService.generateTokens(user);
}

export async function login(input: LoginInput): Promise<Tokens> {
  const user = await usersService.checkCredentials(input);

  return tokensService.generateTokens(user);
}

export async function logout(refreshToken: string): Promise<void> {
  await tokensService.deleteRefreshToken(refreshToken);
}
