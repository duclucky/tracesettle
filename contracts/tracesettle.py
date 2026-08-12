# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
import json


GEN = 10 ** 18


@allow_storage
@dataclass
class WorkflowRecord:
    sponsor: Address
    objective: str
    status: str
    pool: bigint
    review_nonce: u256
    settled: bool
    cancelled: bool
    total_fee_weight: u256


@allow_storage
@dataclass
class StepRecord:
    provider: Address
    promise: str
    dependencies: str
    fee_weight: u256
    bond: bigint
    accepted: bool
    evidence_url: str
    digest: str
    step_class: str


@allow_storage
@dataclass
class AttemptRecord:
    verdict: str
    coverage: str
    root_cause_steps: str
    consequence_class: str
    reason: str
    finalized: bool


class TraceSettleContract(gl.Contract):
    workflows: TreeMap[str, WorkflowRecord]
    steps: TreeMap[str, StepRecord]
    attempts: TreeMap[str, AttemptRecord]
    credits: TreeMap[str, bigint]
    workflow_ids: DynArray[str]

    def __init__(self) -> None:
        pass

    def _sender(self) -> Address:
        return gl.message.sender_address

    def _sender_key(self) -> str:
        return str(self._sender())

    def _step_key(self, workflow_id: str, step_id: str) -> str:
        return workflow_id + ":" + step_id

    def _credit_key(self, owner: Address) -> str:
        return str(owner)

    def _require_sponsor(self, workflow_id: str) -> WorkflowRecord:
        if workflow_id not in self.workflows:
            raise gl.vm.UserError("unknown workflow")
        workflow = self.workflows[workflow_id]
        if workflow.sponsor != self._sender():
            raise gl.vm.UserError("unauthorized")
        return workflow

    def _add_credit(self, owner: Address, amount: bigint) -> None:
        key = self._credit_key(owner)
        if key not in self.credits:
            self.credits[key] = bigint(0)
        self.credits[key] = self.credits[key] + amount

    @gl.public.write.payable
    def create_workflow(self, workflow_id: str, objective: str) -> None:
        if workflow_id in self.workflows:
            raise gl.vm.UserError("duplicate workflow")
        if gl.message.value != 2 * GEN:
            raise gl.vm.UserError("create requires 2 GEN")
        if len(objective) == 0:
            raise gl.vm.UserError("empty objective")
        self.workflows[workflow_id] = WorkflowRecord(
            sponsor=self._sender(),
            objective=objective,
            status="DRAFT",
            pool=bigint(gl.message.value),
            review_nonce=u256(0),
            settled=False,
            cancelled=False,
            total_fee_weight=u256(0),
        )
        self.workflow_ids.append(workflow_id)

    @gl.public.write
    def add_step(
        self,
        workflow_id: str,
        step_id: str,
        provider: Address,
        promise: str,
        dependencies: str,
        fee_weight: u256,
    ) -> None:
        workflow = self._require_sponsor(workflow_id)
        if workflow.status != "DRAFT":
            raise gl.vm.UserError("wrong state")
        key = self._step_key(workflow_id, step_id)
        if key in self.steps:
            raise gl.vm.UserError("duplicate step")
        if fee_weight == 0:
            raise gl.vm.UserError("zero fee weight")
        self.steps[key] = StepRecord(
            provider=provider,
            promise=promise,
            dependencies=dependencies,
            fee_weight=fee_weight,
            bond=bigint(0),
            accepted=False,
            evidence_url="",
            digest="",
            step_class="PENDING",
        )
        workflow.total_fee_weight = workflow.total_fee_weight + fee_weight
        self.workflows[workflow_id] = workflow

    @gl.public.write
    def activate_workflow(self, workflow_id: str) -> None:
        workflow = self._require_sponsor(workflow_id)
        if workflow.status != "DRAFT":
            raise gl.vm.UserError("wrong state")
        if workflow.total_fee_weight == 0:
            raise gl.vm.UserError("no steps")
        workflow.status = "OPEN"
        self.workflows[workflow_id] = workflow

    @gl.public.write.payable
    def accept_step(self, workflow_id: str, step_id: str) -> None:
        workflow = self.workflows[workflow_id]
        key = self._step_key(workflow_id, step_id)
        step = self.steps[key]
        if workflow.status != "OPEN":
            raise gl.vm.UserError("wrong state")
        if step.provider != self._sender():
            raise gl.vm.UserError("unauthorized")
        if step.accepted:
            raise gl.vm.UserError("duplicate accept")
        if gl.message.value != GEN:
            raise gl.vm.UserError("accept requires 1 GEN")
        step.accepted = True
        step.bond = bigint(gl.message.value)
        self.steps[key] = step

    @gl.public.write
    def submit_evidence(self, workflow_id: str, step_id: str, url: str, digest: str) -> None:
        workflow = self.workflows[workflow_id]
        key = self._step_key(workflow_id, step_id)
        step = self.steps[key]
        if workflow.status != "OPEN":
            raise gl.vm.UserError("wrong state")
        if step.provider != self._sender():
            raise gl.vm.UserError("unauthorized")
        if not step.accepted:
            raise gl.vm.UserError("step not accepted")
        if not url.startswith("https://"):
            raise gl.vm.UserError("invalid url")
        if not digest.startswith("sha256:"):
            raise gl.vm.UserError("invalid digest")
        step.evidence_url = url
        step.digest = digest
        self.steps[key] = step

    @gl.public.write
    def lock_evidence(self, workflow_id: str) -> None:
        workflow = self._require_sponsor(workflow_id)
        if workflow.status != "OPEN":
            raise gl.vm.UserError("wrong state")
        workflow.status = "EVIDENCE_LOCKED"
        self.workflows[workflow_id] = workflow

    @gl.public.write
    def request_review(self, workflow_id: str) -> None:
        workflow = self._require_sponsor(workflow_id)
        if workflow.settled:
            raise gl.vm.UserError("already settled")
        if workflow.status not in ("EVIDENCE_LOCKED", "RETRYABLE"):
            raise gl.vm.UserError("wrong state")

        def leader_fn():
            prompt = (
                "Classify the locked TraceSettle workflow. "
                'Reply JSON: {"verdict":"SUCCESS|MATERIAL_FAILURE|UNVERIFIABLE",'
                '"coverage":"COMPLETE|INCOMPLETE","reason":str}'
            )
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            mine = leader_fn()
            return mine["verdict"] == leader_res.calldata["verdict"]

        result = gl.vm.run_nondet(leader_fn, validator_fn)
        verdict = result["verdict"]
        if verdict == "UNVERIFIABLE":
            workflow.status = "RETRYABLE"
            self.workflows[workflow_id] = workflow
            return
        workflow.status = "SETTLED"
        workflow.settled = True
        self._add_credit(workflow.sponsor, workflow.pool)
        workflow.pool = bigint(0)
        self.attempts[workflow_id] = AttemptRecord(
            verdict=verdict,
            coverage=result.get("coverage", "COMPLETE"),
            root_cause_steps="",
            consequence_class="PAY_ALL" if verdict == "SUCCESS" else "NET_FAULT",
            reason=result.get("reason", ""),
            finalized=True,
        )
        self.workflows[workflow_id] = workflow

    @gl.public.write
    def retry_review(self, workflow_id: str) -> None:
        workflow = self._require_sponsor(workflow_id)
        if workflow.status != "RETRYABLE":
            raise gl.vm.UserError("wrong state")
        workflow.review_nonce = workflow.review_nonce + u256(1)
        workflow.status = "EVIDENCE_LOCKED"
        self.workflows[workflow_id] = workflow
        self.request_review(workflow_id)

    @gl.public.write
    def cancel_workflow(self, workflow_id: str) -> None:
        workflow = self._require_sponsor(workflow_id)
        if workflow.cancelled:
            raise gl.vm.UserError("already cancelled")
        if workflow.status not in ("DRAFT", "OPEN", "RETRYABLE"):
            raise gl.vm.UserError("wrong state")
        self._add_credit(workflow.sponsor, workflow.pool)
        workflow.pool = bigint(0)
        workflow.cancelled = True
        workflow.status = "CANCELLED"
        self.workflows[workflow_id] = workflow

    @gl.public.write
    def withdraw_credit(self) -> None:
        key = self._sender_key()
        if key not in self.credits or self.credits[key] == 0:
            raise gl.vm.UserError("no credit")
        amount = self.credits[key]
        self.credits[key] = bigint(0)
        gl.get_contract_at(self._sender()).emit_transfer(value=u256(amount))

    @gl.public.view
    def get_workflow(self, workflow_id: str) -> dict:
        if workflow_id not in self.workflows:
            return {}
        workflow = self.workflows[workflow_id]
        return {
            "sponsor": str(workflow.sponsor),
            "objective": workflow.objective,
            "status": workflow.status,
            "pool": str(workflow.pool),
            "settled": workflow.settled,
            "cancelled": workflow.cancelled,
        }

    @gl.public.view
    def get_step(self, workflow_id: str, step_id: str) -> dict:
        key = self._step_key(workflow_id, step_id)
        if key not in self.steps:
            return {}
        step = self.steps[key]
        return {
            "provider": str(step.provider),
            "promise": step.promise,
            "dependencies": step.dependencies,
            "bond": str(step.bond),
            "accepted": step.accepted,
            "evidence_url": step.evidence_url,
            "digest": step.digest,
            "step_class": step.step_class,
        }

    @gl.public.view
    def get_attempt(self, workflow_id: str) -> dict:
        if workflow_id not in self.attempts:
            return {}
        attempt = self.attempts[workflow_id]
        return {
            "verdict": attempt.verdict,
            "coverage": attempt.coverage,
            "root_cause_steps": attempt.root_cause_steps,
            "consequence_class": attempt.consequence_class,
            "reason": attempt.reason,
            "finalized": attempt.finalized,
        }

    @gl.public.view
    def get_credit(self, owner: Address) -> dict:
        key = self._credit_key(owner)
        amount = self.credits[key] if key in self.credits else bigint(0)
        return {"owner": str(owner), "amount": str(amount)}

    @gl.public.view
    def list_workflows(self, offset: u256, limit: u256) -> DynArray[str]:
        return self.workflow_ids
