import { LiveTraceSettleAction } from "../components/LiveTraceSettleAction";
import { TransactionState } from "../components/TransactionState";

export function NewWorkflowPage() {
  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">Sponsor setup</span>
        <h1>Create workflow</h1>
        <p className="lead">
          Define the objective, provider steps, evidence policy, fee weights, and 2 GEN
          pool before the contract locks the terms.
        </p>
      </div>

      <div className="grid two">
        <form className="form-panel field-grid">
          <label>
            Workflow objective
            <textarea defaultValue="Produce a verified travel-planning workflow with itinerary, reservation handoff, and cancellation notes." />
          </label>
          <label>
            Evidence host policy
            <input defaultValue="https://example.com/tracesettle/" />
          </label>
          <label>
            Sponsor pool
            <select defaultValue="2">
              <option value="2">2 GEN</option>
            </select>
          </label>
          <LiveTraceSettleAction
            className="button primary"
            action={(adapter) =>
              adapter.createWorkflow({
                objective:
                  "Produce a verified travel-planning workflow with itinerary, reservation handoff, and cancellation notes.",
                providerAddresses: ["0x2222222222222222222222222222222222222222"],
                poolGen: 2
              })
            }
          >
            Submit workflow transaction
          </LiveTraceSettleAction>
        </form>
        <section className="panel stack">
          <h2>Setup checks</h2>
          <p className="muted">
            The frontend validates missing fields and obvious DAG errors, then the contract
            remains authoritative after wallet submission.
          </p>
          <TransactionState />
        </section>
      </div>
    </section>
  );
}
