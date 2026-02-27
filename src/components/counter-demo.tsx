"use client";

import { Button } from "@/components/ui/button";
import { useExampleStore } from "@/store/example-store";

export function CounterDemo() {
  const { count, increment, decrement, reset } = useExampleStore();

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
      <p className="text-muted-foreground">Zustand + shadcn Button</p>
      <p className="text-3xl font-bold tabular-nums">{count}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={decrement}>
          −
        </Button>
        <Button size="sm" onClick={reset}>
          Reset
        </Button>
        <Button variant="default" size="sm" onClick={increment}>
          +
        </Button>
      </div>
    </div>
  );
}
