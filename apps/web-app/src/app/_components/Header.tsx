import Link from "next/link";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="bg-slate-700 p-4 text-white">
      <section className="container m-auto flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
      </section>
    </header>
  );
}
