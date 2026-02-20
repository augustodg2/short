import Link from "next/link";

export default function Home() {
  return (
    <div className="container m-auto mt-4">
      <h1>Short</h1>

      <Link
        href="/status"
        className="text-blue-500 no-underline hover:text-blue-700 hover:underline"
      >
        Status
      </Link>
    </div>
  );
}
