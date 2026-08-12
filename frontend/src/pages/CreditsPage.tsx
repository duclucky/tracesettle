import { TransactionState } from "../components/TransactionState";
import { credits } from "../domain/fixtures";

export function CreditsPage() {
  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">Canonical credit ledger</span>
        <h1>Credits</h1>
        <p className="lead">
          Withdrawable GEN appears only after canonical contract reads. This screen does
          not show simulated wallet balances, gas, or fees.
        </p>
      </div>

      <div className="grid two">
        <section className="panel stack">
          <h2>{credits.totalAvailableGen} GEN available</h2>
          <div className="credit-list">
            {credits.lines.map((line) => (
              <article className="credit-line" key={`${line.workflowId}-${line.reason}`}>
                <h3>{line.reason}</h3>
                <p className="muted">
                  {line.workflowId} - {line.amountGen} GEN - {line.status}
                </p>
              </article>
            ))}
          </div>
          <button className="button primary" type="button">
            Prepare withdrawal
          </button>
        </section>
        <TransactionState />
      </div>
    </section>
  );
}
