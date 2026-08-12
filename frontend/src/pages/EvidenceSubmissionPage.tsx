import { useParams } from "react-router-dom";
import { LiveTraceSettleAction } from "../components/LiveTraceSettleAction";
import { TransactionState } from "../components/TransactionState";
import { workflows } from "../domain/fixtures";

export function EvidenceSubmissionPage() {
  const { workflowId, stepId } = useParams();
  const workflow = workflows.find((item) => item.id === workflowId) ?? workflows[0];
  const step = workflow.steps.find((item) => item.id === stepId) ?? workflow.steps[1];

  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">{step.providerLabel}</span>
        <h1>Submit evidence</h1>
        <p className="lead">
          Submit the artifact URL and digest for the locked provider step. Success is not
          shown until the wallet transaction finalizes and canonical state reloads.
        </p>
      </div>

      <div className="grid two">
        <form className="form-panel field-grid">
          <label>
            Artifact URL
            <input defaultValue={step.evidenceUrl ?? "https://example.com/tracesettle/trace-1001/build.json"} />
          </label>
          <label>
            Artifact digest
            <input
              className="mono"
              defaultValue={
                step.digest ??
                "sha256:9b4f2d49fd0c3b6e9cf38d28e7f2d0d71cb0f5e6824f519807a8fd9f2d2c36aa"
              }
            />
          </label>
          <label>
            Bond
            <select defaultValue="1">
              <option value="1">1 GEN</option>
            </select>
          </label>
          <LiveTraceSettleAction
            className="button primary"
            action={(adapter) =>
              adapter.submitEvidence({
                workflowId: workflow.id,
                stepId: step.id,
                artifactUrl: step.evidenceUrl ?? "https://example.com/tracesettle/trace-1001/build.json",
                digest:
                  step.digest ??
                  "sha256:9b4f2d49fd0c3b6e9cf38d28e7f2d0d71cb0f5e6824f519807a8fd9f2d2c36aa"
              })
            }
          >
            Submit evidence transaction
          </LiveTraceSettleAction>
        </form>

        <aside className="stack">
          <section className="panel stack">
            <h2>Step promise</h2>
            <p>{step.promise}</p>
            <p className="muted">
              Dependencies: {step.dependencies.length > 0 ? step.dependencies.join(", ") : "none"}
            </p>
          </section>
          <TransactionState />
        </aside>
      </div>
    </section>
  );
}
