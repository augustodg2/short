import argon2 from "argon2";
import { EmailAlreadyInUseError } from "./errors/EmailAlreadyInUseError.js";
import * as usersRepository from "./users.repository.js";
import { InvalidCredentialsError } from "./errors/InvalidCredentialsError.js";
import { User } from "../../db/entities.js";

export async function create(input: {
  email: string;
  password: string;
}): Promise<Pick<User, "id" | "email" | "createdAt">> {
  const existingUser = await usersRepository.getByEmail(input.email);

  if (existingUser) {
    throw new EmailAlreadyInUseError();
  }

  const passwordHash = await argon2.hash(input.password);

  const user = await usersRepository.create({
    email: input.email,
    passwordHash,
  });

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}
export async function checkCredentials(input: {
  email: string;
  password: string;
}): Promise<Pick<User, "id" | "email" | "createdAt">> {
  const user = await usersRepository.getByEmail(input.email);

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatch = await argon2.verify(user.passwordHash, input.password);

  if (!passwordMatch) {
    throw new InvalidCredentialsError();
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}
