import { WorkflowList } from "../components/WorkflowList";
import { workflows } from "../domain/fixtures";

const filters = ["Active", "Needs action", "Retryable", "Settled", "Cancelled"];

export function WorkflowInboxPage() {
  return (
    <section className="page">
      <div className="page-header">
        <span className="page-kicker">Canonical workflow reads</span>
        <h1>Workflow inbox</h1>
        <p className="lead">
          Review workflows for the connected address. Fixture rows are isolated dev data
          until a deployed contract address is configured.
        </p>
      </div>

      <div className="stack">
        <div className="filters" aria-label="Workflow filters">
          {filters.map((filter) => (
            <button className="filter-chip" type="button" key={filter}>
              {filter}
            </button>
          ))}
        </div>
        <WorkflowList workflows={workflows} />
      </div>
    </section>
  );
}
