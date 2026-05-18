import { FastifyInstance } from "fastify";

export async function registerUser(
  app: FastifyInstance,
  {
    email,
    password,
  }: {
    email: string;
    password: string;
  } = {
    email: "user@example.com",
    password: "Password@123",
  },
) {
  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password, confirmPassword: password },
  });

  return res.json().accessToken;
}
