import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { toUserStatus } from "../adapters/contractAdapter";
import type { WorkflowSummary } from "../domain/types";
import { StatusBadge } from "./StatusBadge";

export function WorkflowList({ workflows }: { workflows: WorkflowSummary[] }) {
  if (workflows.length === 0) {
    return (
      <section className="panel stack">
        <h2>No workflows yet</h2>
        <p className="muted">
          Connected workflows will appear here after canonical contract reads are available.
        </p>
      </section>
    );
  }

  return (
    <div className="workflow-list">
      {workflows.map((workflow) => {
        const status = toUserStatus(workflow.status);
        return (
          <Link className="workflow-row" to={`/workflows/${workflow.id}`} key={workflow.id}>
            <div className="stack">
              <div className="row-meta">
                <StatusBadge status={workflow.status} />
                <span className="badge">{workflow.role}</span>
                <span className="badge">{workflow.poolGen} GEN pool</span>
              </div>
              <h2>{workflow.objective}</h2>
              <p className="muted">{status.nextStep}</p>
            </div>
            <div className="stack">
              <span className="mono">{workflow.id}</span>
              <span className="button secondary">
                Open <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
