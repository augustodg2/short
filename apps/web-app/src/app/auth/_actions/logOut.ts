"use server";

import { signOut } from "@workos-inc/authkit-nextjs";

export async function logOutAction() {
  await signOut();
}
