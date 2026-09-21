import type { ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ListPlaceholderProps =
  | { variant: "loading"; label: string }
  | { variant: "empty"; title: string; description: string; action?: ReactNode }
  | { variant: "error"; label: string };

export function ListPlaceholder(props: ListPlaceholderProps) {
  if (props.variant === "loading") {
    return <p className="text-muted-foreground">{props.label}</p>;
  }
  if (props.variant === "error") {
    return <p className="text-destructive">{props.label}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
        {props.action ? <div className="pt-2">{props.action}</div> : null}
      </CardHeader>
    </Card>
  );
}

