export function getInitials({
  firstName,
  lastName,
}: {
  firstName: string | null;
  lastName: string | null;
}) {
  if (!firstName && !lastName) {
    return null;
  }

  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`;
}

export function getFullName({
  firstName,
  lastName,
}: {
  firstName: string | null;
  lastName: string | null;
}) {
  if (!firstName) {
    return lastName;
  }

  if (!lastName) {
    return firstName;
  }

  return `${firstName} ${lastName}`;
}
