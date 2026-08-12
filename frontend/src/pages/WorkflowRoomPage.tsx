import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { TransactionState } from "../components/TransactionState";
import { workflows } from "../domain/fixtures";

export function WorkflowRoomPage() {
  const { workflowId } = useParams();
  const workflow = workflows.find((item) => item.id === workflowId) ?? workflows[0];

  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">Workflow {workflow.id}</span>
        <h1>Workflow room</h1>
        <p className="lead">{workflow.objective}</p>
      </div>

      <div className="grid two">
        <section className="panel stack">
          <div className="row-meta">
            <StatusBadge status={workflow.status} />
            <span className="badge">{workflow.poolGen} GEN pool</span>
            <span className="badge">{workflow.role}</span>
          </div>
          <h2>Provider path</h2>
          <div className="step-list">
            {workflow.steps.map((step) => (
              <article className="step-item stack" key={step.id}>
                <div className="row-meta">
                  <span className="mono">{step.id}</span>
                  <span className="badge">{step.accepted ? "Accepted" : "Needs acceptance"}</span>
                </div>
                <h3>{step.title}</h3>
                <p className="muted">{step.promise}</p>
                {step.dependencies.length > 0 && (
                  <p className="muted">Depends on {step.dependencies.join(", ")}</p>
                )}
                <Link className="button secondary" to={`/workflows/${workflow.id}/evidence/${step.id}`}>
                  Open evidence
                </Link>
              </article>
            ))}
          </div>
        </section>

        <aside className="stack">
          <section className="panel stack">
            <h2>Next legal action</h2>
            <p>{workflow.nextAction}</p>
            <div className="actions">
              <button className="button primary" type="button">
                Lock evidence
              </button>
              <button className="button secondary" type="button">
                Request review
              </button>
              <button className="button danger" type="button">
                Cancel safely
              </button>
            </div>
          </section>
          <TransactionState stage={workflow.status === "RETRYABLE" ? "retryable" : "idle"} />
          <details className="panel">
            <summary>Verification details</summary>
            <p className="muted">
              Raw attempt IDs, evidence digests, and Explorer links stay here so the main
              workflow remains user-focused.
            </p>
          </details>
        </aside>
      </div>
    </section>
  );
}
