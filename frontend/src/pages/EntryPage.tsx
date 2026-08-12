import { ArrowRight, ClipboardText } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function EntryPage() {
  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">Agent workflow settlement</span>
        <h1>Settle the failed workflow</h1>
        <p className="lead">
          TraceSettle helps sponsors and providers resolve multi-step agent failures from
          bounded evidence, not from one operator's blame report.
        </p>
      </div>

      <div className="grid two">
        <section className="panel stack">
          <h2>Start as sponsor</h2>
          <p className="muted">
            Create a bounded workflow, fund 2 GEN, lock providers and promises, then
            request neutral review after evidence is ready.
          </p>
          <div className="actions">
            <Link className="button primary" to="/workflows/new">
              Create workflow <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
            <Link className="button secondary" to="/workflows">
              Open inbox
            </Link>
          </div>
        </section>

        <section className="panel stack">
          <h2>Work as provider</h2>
          <p className="muted">
            Review assigned steps, post a 1 GEN bond, submit artifact evidence, and
            withdraw canonical credit after settlement.
          </p>
          <div className="actions">
            <Link className="button primary" to="/workflows/trace-1001/evidence/step-build">
              Review assigned steps
              <ClipboardText size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
