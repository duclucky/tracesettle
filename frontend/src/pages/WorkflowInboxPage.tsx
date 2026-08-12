import { useEffect, useState } from "react";
import { createGenLayerTraceSettleAdapter } from "../adapters/genlayerAdapter";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import { WorkflowList } from "../components/WorkflowList";
import { workflows } from "../domain/fixtures";
import type { WorkflowSummary } from "../domain/types";

const filters = ["Active", "Needs action", "Retryable", "Settled", "Cancelled"];

export function WorkflowInboxPage() {
  const runtime = resolveRuntimeConfig(import.meta.env);
  const [items, setItems] = useState<WorkflowSummary[]>(workflows);
  const [readState, setReadState] = useState(
    runtime.mode === "live" ? "Loading canonical contract workflows..." : runtime.reason
  );

  useEffect(() => {
    let disposed = false;
    if (runtime.mode !== "live" || !runtime.contractAddress) {
      setItems(workflows);
      setReadState(`${runtime.reason}. Showing labeled preview rows.`);
      return () => {
        disposed = true;
      };
    }

    const adapter = createGenLayerTraceSettleAdapter({ address: runtime.contractAddress });
    adapter
      .listWorkflows("")
      .then((canonicalWorkflows) => {
        if (disposed) {
          return;
        }
        setItems(canonicalWorkflows);
        setReadState("Loaded canonical workflow IDs and summaries from contract views.");
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }
        setItems([]);
        setReadState(error instanceof Error ? error.message : "Canonical workflow read failed.");
      });

    return () => {
      disposed = true;
    };
  }, [runtime.contractAddress, runtime.mode, runtime.reason]);

  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">Canonical workflow reads</span>
        <h1>Workflow inbox</h1>
        <p className="lead">
          Review workflows from canonical contract views when a deployed address is configured.
          Preview rows are isolated dev data and labeled as such.
        </p>
      </div>

      <div className="stack">
        <aside className={runtime.mode === "live" ? "notice" : "notice danger-note"}>
          <strong>{runtime.mode === "live" ? "Contract read" : "Preview read"}</strong>
          <p>{readState}</p>
        </aside>
        <div className="filters" aria-label="Workflow filters">
          {filters.map((filter) => (
            <button className="filter-chip" type="button" key={filter}>
              {filter}
            </button>
          ))}
        </div>
        <WorkflowList workflows={items} />
      </div>
    </section>
  );
}
