import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { User } from "lucide-react";
import Link from "next/link";
import { logOutAction } from "../auth/_actions/logOut";
import { getFullName, getInitials } from "../auth/_utils/user";
import { Logo } from "./Logo";

export async function Header() {
  const { user } = await withAuth();

  return (
    <header className="sticky top-0 z-10 flex h-15 items-center bg-slate-700 text-white">
      <section className="container m-auto flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>

        {user ? <UserMenu user={user} /> : null}
      </section>
    </header>
  );
}

function UserMenu({
  user,
}: {
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="cursor-pointer hover:text-white">
          <Avatar>
            <AvatarFallback>{getInitials(user) || <User />}</AvatarFallback>
          </Avatar>

          {getFullName(user)}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <form action={logOutAction}>
              <button type="submit">Log out</button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
