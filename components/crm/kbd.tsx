export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}
