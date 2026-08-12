import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createGenLayerTraceSettleAdapter } from "../adapters/genlayerAdapter";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import { LiveTraceSettleAction } from "../components/LiveTraceSettleAction";
import { StatusBadge } from "../components/StatusBadge";
import { TransactionState } from "../components/TransactionState";
import { workflows } from "../domain/fixtures";
import type { WorkflowSummary } from "../domain/types";

export function WorkflowRoomPage() {
  const { workflowId } = useParams();
  const runtime = resolveRuntimeConfig(import.meta.env);
  const previewWorkflow = workflows.find((item) => item.id === workflowId) ?? workflows[0];
  const [workflow, setWorkflow] = useState<WorkflowSummary>(previewWorkflow);
  const [readState, setReadState] = useState(
    runtime.mode === "live" ? "Loading canonical workflow..." : runtime.reason
  );

  useEffect(() => {
    let disposed = false;
    if (runtime.mode !== "live" || !runtime.contractAddress || !workflowId) {
      setWorkflow(previewWorkflow);
      setReadState(`${runtime.reason}. Showing labeled preview workflow.`);
      return () => {
        disposed = true;
      };
    }

    createGenLayerTraceSettleAdapter({ address: runtime.contractAddress })
      .getWorkflow(workflowId)
      .then((canonicalWorkflow) => {
        if (disposed) {
          return;
        }
        if (canonicalWorkflow) {
          setWorkflow(canonicalWorkflow);
          setReadState("Loaded canonical workflow and step views from the contract.");
          return;
        }
        setReadState("Workflow was not found in canonical contract state.");
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }
        setReadState(error instanceof Error ? error.message : "Canonical workflow read failed.");
      });

    return () => {
      disposed = true;
    };
  }, [previewWorkflow, runtime.contractAddress, runtime.mode, runtime.reason, workflowId]);

  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">Workflow {workflow.id}</span>
        <h1>Workflow room</h1>
        <p className="lead">{workflow.objective}</p>
      </div>

      <div className="grid two">
        <section className="panel stack">
          <aside className={runtime.mode === "live" ? "notice" : "notice danger-note"}>
            <strong>{runtime.mode === "live" ? "Contract read" : "Preview read"}</strong>
            <p>{readState}</p>
          </aside>
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
              <LiveTraceSettleAction
                className="button primary"
                action={(adapter) => adapter.lockEvidence(workflow.id)}
              >
                Lock evidence
              </LiveTraceSettleAction>
              <LiveTraceSettleAction
                className="button secondary"
                action={(adapter) => adapter.requestReview(workflow.id)}
              >
                Request review
              </LiveTraceSettleAction>
              <LiveTraceSettleAction
                className="button danger"
                action={(adapter) => adapter.cancelWorkflow(workflow.id)}
              >
                Cancel safely
              </LiveTraceSettleAction>
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
