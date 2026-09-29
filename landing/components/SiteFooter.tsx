import { SignInLink } from "@/components/AppLink";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8">
        <div>
          <p className="font-serif text-lg">Personal Record</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Track time and reps against your own KPIs. Periods close themselves.
          </p>
        </div>
        <SignInLink />
      </div>
    </footer>
  );
}
