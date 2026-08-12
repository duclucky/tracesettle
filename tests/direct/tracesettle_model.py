from dataclasses import dataclass, field


GEN = 10**18


class TraceSettleError(Exception):
    pass


@dataclass
class Step:
    step_id: str
    provider: str
    promise: str
    dependencies: list[str]
    fee_weight: int
    accepted: bool = False
    bond: int = 0
    evidence_url: str = ""
    digest: str = ""
    digest_mismatch: bool = False
    step_class: str = "PENDING"


@dataclass
class Workflow:
    sponsor: str
    workflow_id: str
    objective: str
    pool: int
    status: str = "DRAFT"
    steps: dict[str, Step] = field(default_factory=dict)
    settled: bool = False
    cancelled: bool = False


@dataclass
class ReviewResult:
    verdict: str
    classes: dict[str, str]
    roots: list[str]
    reason: str

    @classmethod
    def success(cls, step_ids: list[str]) -> "ReviewResult":
        return cls(
            verdict="SUCCESS",
            classes={step_id: "SATISFIED" for step_id in step_ids},
            roots=[],
            reason="all steps satisfied",
        )

    @classmethod
    def material_failure(cls, classes: dict[str, str], roots: list[str]) -> "ReviewResult":
        return cls(
            verdict="MATERIAL_FAILURE",
            classes=classes,
            roots=roots,
            reason="material fault",
        )

    @classmethod
    def unverifiable(cls, reason: str) -> "ReviewResult":
        return cls(verdict="UNVERIFIABLE", classes={}, roots=[], reason=reason)


class TraceSettleModel:
    def __init__(self) -> None:
        self.workflows: dict[str, Workflow] = {}
        self.credits: dict[str, int] = {}

    def _workflow(self, workflow_id: str) -> Workflow:
        if workflow_id not in self.workflows:
            raise TraceSettleError("unknown workflow")
        return self.workflows[workflow_id]

    def _credit(self, owner: str, amount: int) -> None:
        self.credits[owner] = self.credits.get(owner, 0) + amount

    def create_workflow(self, caller: str, workflow_id: str, objective: str, value: int) -> None:
        if workflow_id in self.workflows:
            raise TraceSettleError("duplicate workflow")
        if value != 2 * GEN:
            raise TraceSettleError("create requires 2 GEN")
        if not objective.strip():
            raise TraceSettleError("empty objective")
        self.workflows[workflow_id] = Workflow(caller, workflow_id, objective, value)

    def add_step(
        self,
        caller: str,
        workflow_id: str,
        step_id: str,
        provider: str,
        promise: str,
        dependencies: list[str],
        fee_weight: int,
    ) -> None:
        workflow = self._workflow(workflow_id)
        if caller != workflow.sponsor:
            raise TraceSettleError("unauthorized")
        if workflow.status != "DRAFT":
            raise TraceSettleError("wrong state")
        if step_id in workflow.steps:
            raise TraceSettleError("duplicate step")
        if step_id in dependencies:
            raise TraceSettleError("cycle")
        if fee_weight <= 0:
            raise TraceSettleError("zero fee weight")
        for dependency in dependencies:
            if dependency not in workflow.steps:
                raise TraceSettleError("unknown dependency")
        workflow.steps[step_id] = Step(step_id, provider, promise, dependencies, fee_weight)
        if self._has_cycle(workflow):
            del workflow.steps[step_id]
            raise TraceSettleError("cycle")

    def _has_cycle(self, workflow: Workflow) -> bool:
        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(step_id: str) -> bool:
            if step_id in visiting:
                return True
            if step_id in visited:
                return False
            visiting.add(step_id)
            for dependency in workflow.steps[step_id].dependencies:
                if dependency in workflow.steps and visit(dependency):
                    return True
            visiting.remove(step_id)
            visited.add(step_id)
            return False

        return any(visit(step_id) for step_id in workflow.steps)

    def activate_workflow(self, caller: str, workflow_id: str) -> None:
        workflow = self._workflow(workflow_id)
        if caller != workflow.sponsor:
            raise TraceSettleError("unauthorized")
        if workflow.status != "DRAFT":
            raise TraceSettleError("wrong state")
        if not workflow.steps:
            raise TraceSettleError("no steps")
        workflow.status = "OPEN"

    def accept_step(self, caller: str, workflow_id: str, step_id: str, value: int) -> None:
        workflow = self._workflow(workflow_id)
        step = workflow.steps[step_id]
        if workflow.status != "OPEN":
            raise TraceSettleError("wrong state")
        if caller != step.provider:
            raise TraceSettleError("unauthorized")
        if step.accepted:
            raise TraceSettleError("duplicate accept")
        if value != GEN:
            raise TraceSettleError("accept requires 1 GEN")
        step.accepted = True
        step.bond = value

    def submit_evidence(
        self, caller: str, workflow_id: str, step_id: str, url: str, digest: str
    ) -> None:
        workflow = self._workflow(workflow_id)
        step = workflow.steps[step_id]
        if workflow.status != "OPEN":
            raise TraceSettleError("wrong state")
        if caller != step.provider:
            raise TraceSettleError("unauthorized")
        if not step.accepted:
            raise TraceSettleError("step not accepted")
        if not url.startswith("https://"):
            raise TraceSettleError("invalid url")
        if not digest.startswith("sha256:"):
            raise TraceSettleError("invalid digest")
        step.evidence_url = url
        step.digest = digest

    def lock_evidence(self, caller: str, workflow_id: str) -> None:
        workflow = self._workflow(workflow_id)
        if caller != workflow.sponsor:
            raise TraceSettleError("unauthorized")
        if workflow.status != "OPEN":
            raise TraceSettleError("wrong state")
        if any(not step.evidence_url for step in workflow.steps.values()):
            raise TraceSettleError("missing evidence")
        workflow.status = "EVIDENCE_LOCKED"

    def mark_digest_mismatch(self, workflow_id: str, step_id: str) -> None:
        self._workflow(workflow_id).steps[step_id].digest_mismatch = True

    def request_review(self, caller: str, workflow_id: str, result: ReviewResult) -> None:
        workflow = self._workflow(workflow_id)
        if caller != workflow.sponsor:
            raise TraceSettleError("unauthorized")
        if workflow.settled:
            raise TraceSettleError("already settled")
        if workflow.status not in {"EVIDENCE_LOCKED", "RETRYABLE"}:
            raise TraceSettleError("wrong state")
        if any(step.digest_mismatch for step in workflow.steps.values()):
            workflow.status = "RETRYABLE"
            return
        if result.verdict == "UNVERIFIABLE":
            workflow.status = "RETRYABLE"
            return
        if result.verdict == "SUCCESS":
            self._settle_success(workflow, result)
            return
        if result.verdict == "MATERIAL_FAILURE":
            self._settle_material_failure(workflow, result)
            return
        raise TraceSettleError("invalid verdict")

    def _fee(self, workflow: Workflow, step: Step) -> int:
        total_weight = sum(item.fee_weight for item in workflow.steps.values())
        return workflow.pool * step.fee_weight // total_weight

    def _settle_success(self, workflow: Workflow, result: ReviewResult) -> None:
        expected = set(workflow.steps)
        if set(result.classes) != expected:
            raise TraceSettleError("missing step")
        paid = 0
        for step_id, step in workflow.steps.items():
            if result.classes[step_id] != "SATISFIED":
                raise TraceSettleError("invalid class")
            fee = self._fee(workflow, step)
            paid += fee
            self._credit(step.provider, step.bond + fee)
            step.bond = 0
        if workflow.pool > paid:
            self._credit(workflow.sponsor, workflow.pool - paid)
        workflow.pool = 0
        workflow.status = "SETTLED"
        workflow.settled = True

    def _settle_material_failure(self, workflow: Workflow, result: ReviewResult) -> None:
        expected = set(workflow.steps)
        if set(result.classes) != expected:
            raise TraceSettleError("missing step")
        faulted = set(result.roots)
        for step_id, step_class in result.classes.items():
            workflow.steps[step_id].step_class = step_class
        paid_fees = 0
        for step_id, step in workflow.steps.items():
            step_class = result.classes[step_id]
            fee = self._fee(workflow, step)
            if step_class in {"SATISFIED", "DOWNSTREAM_BLOCKED"}:
                self._credit(step.provider, step.bond + fee)
                paid_fees += fee
            elif step_class == "MATERIAL_FAULT":
                self._distribute_fault_bond(workflow, step_id, step.bond)
                self._credit(workflow.sponsor, fee)
            else:
                raise TraceSettleError("invalid class")
            step.bond = 0
        workflow.pool = 0
        workflow.status = "SETTLED"
        workflow.settled = True
        if not faulted:
            raise TraceSettleError("missing root cause")

    def _distribute_fault_bond(self, workflow: Workflow, fault_step_id: str, bond: int) -> None:
        blocked = [
            step for step in workflow.steps.values()
            if fault_step_id in step.dependencies and step.step_class == "DOWNSTREAM_BLOCKED"
        ]
        if not blocked:
            self._credit(workflow.sponsor, bond)
            return
        share = bond // len(blocked)
        remainder = bond - share * len(blocked)
        for step in blocked:
            self._credit(step.provider, share)
        if remainder:
            self._credit(workflow.sponsor, remainder)

    def cancel_workflow(self, caller: str, workflow_id: str) -> None:
        workflow = self._workflow(workflow_id)
        if caller != workflow.sponsor:
            raise TraceSettleError("unauthorized")
        if workflow.cancelled:
            raise TraceSettleError("already cancelled")
        if workflow.status not in {"DRAFT", "OPEN", "RETRYABLE"}:
            raise TraceSettleError("wrong state")
        self._credit(workflow.sponsor, workflow.pool)
        workflow.pool = 0
        for step in workflow.steps.values():
            if step.bond:
                self._credit(step.provider, step.bond)
                step.bond = 0
        workflow.cancelled = True
        workflow.status = "CANCELLED"

    def withdraw_credit(self, caller: str) -> int:
        amount = self.credits.get(caller, 0)
        if amount == 0:
            raise TraceSettleError("no credit")
        self.credits[caller] = 0
        return amount

    def workflow(self, workflow_id: str) -> Workflow:
        return self._workflow(workflow_id)

    def credit(self, owner: str) -> int:
        return self.credits.get(owner, 0)

    def locked_total(self, workflow_id: str) -> int:
        workflow = self._workflow(workflow_id)
        return workflow.pool + sum(step.bond for step in workflow.steps.values())
