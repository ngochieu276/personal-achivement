import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  label,
  pending,
  onClick,
}: {
  label: string;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="destructive" disabled={pending} onClick={onClick}>
      <Trash2 className="h-4 w-4" />
      {label}
    </Button>
  );
}
