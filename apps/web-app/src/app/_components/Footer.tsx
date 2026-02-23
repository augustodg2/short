import { Code2 } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="p-4 text-sm text-gray-500">
      <div className="container m-auto flex justify-between">
        <p className="flex items-center gap-2">
          <Code2 className="h-[1.5em] w-[1.5em]" />
          <span>Developed by Augusto Dias</span>
        </p>

        <nav>
          <ul className="flex flex-row-reverse">
            <li>
              <Link
                href="/status"
                className="transition-colors hover:text-gray-600 hover:underline"
              >
                Service status
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
