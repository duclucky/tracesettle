import { toUserStatus } from "../adapters/contractAdapter";
import type { WorkflowStatus } from "../domain/types";

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  const userStatus = toUserStatus(status);
  return <span className={`badge ${userStatus.tone}`}>{userStatus.label}</span>;
}
