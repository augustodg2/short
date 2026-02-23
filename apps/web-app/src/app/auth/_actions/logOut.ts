"use server";

import { signOut } from "@workos-inc/authkit-nextjs";

const isDevelopment = process.env.NODE_ENV === "development";

export async function logOutAction() {
  await signOut({
    returnTo: isDevelopment ? "http://localhost:3000" : undefined,
  });
}
