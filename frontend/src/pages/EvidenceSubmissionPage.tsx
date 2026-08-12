import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createGenLayerTraceSettleAdapter } from "../adapters/genlayerAdapter";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import { LiveTraceSettleAction } from "../components/LiveTraceSettleAction";
import { TransactionState } from "../components/TransactionState";
import { workflows } from "../domain/fixtures";
import type { StepSummary, WorkflowSummary } from "../domain/types";

export function EvidenceSubmissionPage() {
  const { workflowId, stepId } = useParams();
  const runtime = resolveRuntimeConfig(import.meta.env);
  const previewWorkflow = workflows.find((item) => item.id === workflowId) ?? workflows[0];
  const previewStep = previewWorkflow.steps.find((item) => item.id === stepId) ?? previewWorkflow.steps[1];
  const [workflow, setWorkflow] = useState<WorkflowSummary>(previewWorkflow);
  const [step, setStep] = useState<StepSummary>(previewStep);
  const [readState, setReadState] = useState(
    runtime.mode === "live" ? "Loading canonical step..." : runtime.reason
  );

  useEffect(() => {
    let disposed = false;
    if (runtime.mode !== "live" || !runtime.contractAddress || !workflowId || !stepId) {
      setWorkflow(previewWorkflow);
      setStep(previewStep);
      setReadState(`${runtime.reason}. Showing labeled preview evidence fields.`);
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
        if (!canonicalWorkflow) {
          setReadState("Workflow was not found in canonical contract state.");
          return;
        }
        const canonicalStep = canonicalWorkflow.steps.find((item) => item.id === stepId);
        setWorkflow(canonicalWorkflow);
        if (canonicalStep) {
          setStep(canonicalStep);
          setReadState("Loaded canonical step state from contract views.");
          return;
        }
        setReadState("Step was not found in canonical contract state.");
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }
        setReadState(error instanceof Error ? error.message : "Canonical step read failed.");
      });

    return () => {
      disposed = true;
    };
  }, [
    previewStep,
    previewWorkflow,
    runtime.contractAddress,
    runtime.mode,
    runtime.reason,
    stepId,
    workflowId
  ]);

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
          <aside className={runtime.mode === "live" ? "notice" : "notice danger-note"}>
            <strong>{runtime.mode === "live" ? "Contract read" : "Preview read"}</strong>
            <p>{readState}</p>
          </aside>
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
