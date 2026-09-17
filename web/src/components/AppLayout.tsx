import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-svh max-w-5xl px-4 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <Link to="/" className="font-serif text-2xl tracking-tight">
          Personal Record
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted-foreground sm:inline">{user?.name}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
