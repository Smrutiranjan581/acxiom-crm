import { CheckCircle2Icon } from 'lucide-react'

const highlights = [
  'Track customers, leads and deals in one pipeline',
  'Never miss a follow-up with smart reminders',
  'Role-based access for Admins, Managers and Sales teams',
]

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-sidebar-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 size-[24rem] rounded-full bg-violet/20 blur-3xl"
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
            A
          </span>
          <span className="text-lg font-semibold text-sidebar-accent-foreground">AcxiomCRM</span>
        </div>

        <div className="relative flex max-w-md flex-col gap-6">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance text-sidebar-accent-foreground">
            Close more deals with a CRM your whole sales team will actually use.
          </h2>
          <ul className="flex flex-col gap-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-sidebar-primary" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              ['₹4.2 Cr', 'Pipeline tracked'],
              ['38%', 'Win rate'],
              ['1.2k', 'Follow-ups / mo'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
                <p className="text-xl font-semibold text-sidebar-accent-foreground tabular-nums">{v}</p>
                <p className="mt-1 text-xs text-sidebar-foreground/70">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-sidebar-foreground/50">
          {'© 2026 AcxiomCRM. All rights reserved.'}
        </p>
      </section>

      <section className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  )
}
