import { CounterDemo } from "@/components/counter-demo";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Next.js + Tailwind + shadcn + Zustand
        </h1>
        <p className="text-muted-foreground">
          Edit <code className="rounded bg-muted px-1.5 py-0.5 text-sm">src/app/page.tsx</code> to get started.
        </p>
      </div>
      <CounterDemo />
    </div>
  );
}
