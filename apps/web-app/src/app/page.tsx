import { withAuth } from "@workos-inc/authkit-nextjs";
import { getFullName } from "./auth/_utils/user";

export default async function Home() {
  const { user } = await withAuth({ ensureSignedIn: true });

  const fullName = getFullName(user);

  return (
    <div className="container m-auto mt-4">
      <h1>Welcome back{fullName ? `, ${fullName}` : ""}</h1>
      {!user.emailVerified ? (
        <p>Please verify your email: {user.email}</p>
      ) : null}
    </div>
  );
}
