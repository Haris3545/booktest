import { cn } from "@/lib/cn";
import type { Confidence } from "@/lib/types";

const styles: Record<Confidence, string> = {
  high: "bg-success/15 text-success",
  low: "bg-warning/15 text-warning",
  manual: "bg-accent/15 text-accent",
};

const labels: Record<Confidence, string> = {
  high: "Found",
  low: "Needs a check",
  manual: "You confirmed",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={cn(
        "text-xs font-semibold px-2.5 py-1 rounded-full",
        styles[confidence]
      )}
    >
      {labels[confidence]}
    </span>
  );
}
