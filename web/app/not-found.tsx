import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="mt-3 font-serif text-3xl">Page not found</h1>
      <p className="mt-3 text-muted-foreground">That path is not on Personal Record.</p>
      <Link href="/" className="mt-6 text-sm font-medium text-primary underline-offset-4 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
