"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

export function CopySwitchButton({ server }: { server: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard.writeText(`/switch ${server}`);
        toast.success("Copied to clipboard", {
          description: (
            <span className="mt-1.5 block">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                /switch {server}
              </code>
            </span>
          ),
        });
      }}
      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
      title="Copy /switch command"
    >
      <CopyIcon className="size-3.5" />
    </button>
  );
}
