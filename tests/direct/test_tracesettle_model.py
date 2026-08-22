import pytest
import hashlib

from tracesettle_model import (
    GEN,
    TraceSettleModel,
    TraceSettleError,
    ReviewResult,
)


SPONSOR = "0xsponsor"
PLAN = "0xplan"
BUILD = "0xbuild"
CANCEL = "0xcancel"
OUTSIDER = "0xoutsider"


def objective_hash(objective: str) -> str:
    return "sha256:" + hashlib.sha256(objective.encode()).hexdigest()


def artifact_for(model: TraceSettleModel, workflow_id: str, step_id: str) -> str:
    workflow = model.workflow(workflow_id)
    step = workflow.steps[step_id]
    return "\n".join(
        [
            "TRACESETTLE_ATTESTATION",
            f"workflow_id={workflow_id}",
            f"step_id={step_id}",
            f"provider={step.provider}",
            f"objective_hash={objective_hash(workflow.objective)}",
            "claim=provider says the promised work is complete",
        ]
    )


def set_valid_artifacts(model: TraceSettleModel, workflow_id: str) -> None:
    workflow = model.workflow(workflow_id)
    for step_id in workflow.steps:
        workflow.steps[step_id].artifact_text = artifact_for(model, workflow_id, step_id)


def seeded_workflow() -> TraceSettleModel:
    model = TraceSettleModel()
    model.create_workflow(SPONSOR, "trace-1", "Ship a bounded agent workflow", 2 * GEN)
    model.add_step(SPONSOR, "trace-1", "plan", PLAN, "Write the itinerary", [], 7)
    model.add_step(SPONSOR, "trace-1", "build", BUILD, "Create reservation handoff", ["plan"], 8)
    model.add_step(SPONSOR, "trace-1", "cancel", CANCEL, "Add cancellation notes", ["build"], 5)
    model.activate_workflow(SPONSOR, "trace-1")
    model.accept_step(PLAN, "trace-1", "plan", GEN)
    model.accept_step(BUILD, "trace-1", "build", GEN)
    model.accept_step(CANCEL, "trace-1", "cancel", GEN)
    model.submit_evidence(PLAN, "trace-1", "plan", "https://evidence.example/plan.json", "sha256:plan")
    model.submit_evidence(BUILD, "trace-1", "build", "https://evidence.example/build.json", "sha256:build")
    model.submit_evidence(CANCEL, "trace-1", "cancel", "https://evidence.example/cancel.json", "sha256:cancel")
    set_valid_artifacts(model, "trace-1")
    model.lock_evidence(SPONSOR, "trace-1")
    return model


def seeded_open_workflow() -> TraceSettleModel:
    model = TraceSettleModel()
    model.create_workflow(SPONSOR, "trace-open", "Cancelable workflow", 2 * GEN)
    model.add_step(SPONSOR, "trace-open", "plan", PLAN, "Write the itinerary", [], 1)
    model.activate_workflow(SPONSOR, "trace-open")
    model.accept_step(PLAN, "trace-open", "plan", GEN)
    return model


def test_success_settlement_pays_fees_and_returns_bonds():
    model = seeded_workflow()
    model.request_review(
      SPONSOR,
      "trace-1",
      ReviewResult.success(["plan", "build", "cancel"]),
    )

    assert model.workflow("trace-1").status == "SETTLED"
    assert model.credit(PLAN) == GEN + int(2 * GEN * 7 / 20)
    assert model.credit(BUILD) == GEN + int(2 * GEN * 8 / 20)
    assert model.credit(CANCEL) == GEN + int(2 * GEN * 5 / 20)
    assert model.locked_total("trace-1") == 0


def test_material_fault_distributes_fault_bond_to_directly_blocked_provider():
    model = seeded_workflow()
    model.request_review(
      SPONSOR,
      "trace-1",
      ReviewResult.material_failure(
        classes={
          "plan": "SATISFIED",
          "build": "MATERIAL_FAULT",
          "cancel": "DOWNSTREAM_BLOCKED",
        },
        roots=["build"],
      ),
    )

    assert model.workflow("trace-1").status == "SETTLED"
    assert model.credit(BUILD) == 0
    assert model.credit(CANCEL) == GEN + int(2 * GEN * 5 / 20) + GEN
    assert model.credit(SPONSOR) == int(2 * GEN * 8 / 20)
    assert model.locked_total("trace-1") == 0


def test_unverifiable_review_is_retryable_and_non_penalizing():
    model = seeded_workflow()
    model.request_review(SPONSOR, "trace-1", ReviewResult.unverifiable("digest mismatch"))

    assert model.workflow("trace-1").status == "RETRYABLE"
    assert model.credit(SPONSOR) == 0
    assert model.credit(PLAN) == 0
    assert model.locked_total("trace-1") == 5 * GEN


def test_wrong_caller_and_duplicate_withdrawal_are_rejected():
    model = seeded_workflow()
    with pytest.raises(TraceSettleError, match="unauthorized"):
        model.request_review(OUTSIDER, "trace-1", ReviewResult.success(["plan", "build", "cancel"]))

    open_model = seeded_open_workflow()
    open_model.cancel_workflow(SPONSOR, "trace-open")
    first = open_model.withdraw_credit(SPONSOR)
    assert first == 2 * GEN
    with pytest.raises(TraceSettleError, match="no credit"):
        open_model.withdraw_credit(SPONSOR)


def test_digest_mismatch_and_unknown_dependency_cannot_settle():
    model = seeded_workflow()
    model.mark_digest_mismatch("trace-1", "build")
    model.request_review(SPONSOR, "trace-1", ReviewResult.success(["plan", "build", "cancel"]))
    assert model.workflow("trace-1").status == "RETRYABLE"
    assert model.credit(BUILD) == 0

    other = TraceSettleModel()
    other.create_workflow(SPONSOR, "trace-2", "Bad dependency", 2 * GEN)
    other.add_step(SPONSOR, "trace-2", "plan", PLAN, "Write plan", [], 1)
    with pytest.raises(TraceSettleError, match="unknown dependency"):
        other.add_step(SPONSOR, "trace-2", "broken", BUILD, "Broken", ["missing"], 1)


def test_cycle_and_duplicate_settlement_are_rejected():
    model = TraceSettleModel()
    model.create_workflow(SPONSOR, "trace-3", "Cycle", 2 * GEN)
    model.add_step(SPONSOR, "trace-3", "a", PLAN, "A", [], 1)
    model.add_step(SPONSOR, "trace-3", "b", BUILD, "B", ["a"], 1)
    with pytest.raises(TraceSettleError, match="cycle"):
        model.add_step(SPONSOR, "trace-3", "a-again", CANCEL, "Cycle to b", ["b", "a-again"], 1)

    settled = seeded_workflow()
    settled.request_review(SPONSOR, "trace-1", ReviewResult.success(["plan", "build", "cancel"]))
    with pytest.raises(TraceSettleError, match="already settled"):
        settled.request_review(SPONSOR, "trace-1", ReviewResult.success(["plan", "build", "cancel"]))


def test_validator_roots_must_match_material_fault_classes_before_money_moves():
    model = seeded_workflow()
    before_locked = model.locked_total("trace-1")

    with pytest.raises(TraceSettleError, match="root invariant"):
        model.request_review(
            SPONSOR,
            "trace-1",
            ReviewResult.material_failure(
                classes={
                    "plan": "SATISFIED",
                    "build": "MATERIAL_FAULT",
                    "cancel": "DOWNSTREAM_BLOCKED",
                },
                roots=["plan"],
            ),
        )

    assert model.workflow("trace-1").status == "EVIDENCE_LOCKED"
    assert model.locked_total("trace-1") == before_locked
    assert model.credit(SPONSOR) == 0
    assert model.credit(BUILD) == 0
    assert model.credit(CANCEL) == 0


def test_downstream_blocked_class_must_depend_on_a_root_fault_before_money_moves():
    model = seeded_workflow()
    before_locked = model.locked_total("trace-1")

    with pytest.raises(TraceSettleError, match="blocked invariant"):
        model.request_review(
            SPONSOR,
            "trace-1",
            ReviewResult.material_failure(
                classes={
                    "plan": "DOWNSTREAM_BLOCKED",
                    "build": "MATERIAL_FAULT",
                    "cancel": "SATISFIED",
                },
                roots=["build"],
            ),
        )

    assert model.workflow("trace-1").status == "EVIDENCE_LOCKED"
    assert model.locked_total("trace-1") == before_locked
    assert model.credit(PLAN) == 0
    assert model.credit(SPONSOR) == 0


def test_material_failure_settlement_credits_pool_rounding_residual_to_sponsor():
    model = TraceSettleModel()
    model.create_workflow(SPONSOR, "trace-round", "Rounding residual", 2 * GEN)
    model.add_step(SPONSOR, "trace-round", "a", PLAN, "A", [], 1)
    model.add_step(SPONSOR, "trace-round", "b", BUILD, "B", ["a"], 2)
    model.activate_workflow(SPONSOR, "trace-round")
    model.accept_step(PLAN, "trace-round", "a", GEN)
    model.accept_step(BUILD, "trace-round", "b", GEN)
    model.submit_evidence(PLAN, "trace-round", "a", "https://evidence.example/a.json", "sha256:a")
    model.submit_evidence(BUILD, "trace-round", "b", "https://evidence.example/b.json", "sha256:b")
    set_valid_artifacts(model, "trace-round")
    model.lock_evidence(SPONSOR, "trace-round")

    model.request_review(
        SPONSOR,
        "trace-round",
        ReviewResult.material_failure(
            classes={"a": "MATERIAL_FAULT", "b": "DOWNSTREAM_BLOCKED"},
            roots=["a"],
        ),
    )

    assert model.locked_total("trace-round") == 0
    assert model.credit(SPONSOR) == (2 * GEN // 3) + 1


def test_provider_controlled_text_without_provenance_cannot_settle():
    model = seeded_workflow()
    before_locked = model.locked_total("trace-1")
    model.workflow("trace-1").steps["build"].artifact_text = "provider says build succeeded"

    model.request_review(
        SPONSOR,
        "trace-1",
        ReviewResult.success(["plan", "build", "cancel"]),
    )

    assert model.workflow("trace-1").status == "RETRYABLE"
    assert model.locked_total("trace-1") == before_locked
    assert model.credit(PLAN) == 0
    assert model.credit(BUILD) == 0
    assert model.credit(CANCEL) == 0


def test_wrong_objective_hash_provenance_cannot_settle():
    model = seeded_workflow()
    before_locked = model.locked_total("trace-1")
    step = model.workflow("trace-1").steps["plan"]
    step.artifact_text = "\n".join(
        [
            "TRACESETTLE_ATTESTATION",
            "workflow_id=trace-1",
            "step_id=plan",
            f"provider={step.provider}",
            "objective_hash=sha256:wrong",
        ]
    )

    model.request_review(
        SPONSOR,
        "trace-1",
        ReviewResult.success(["plan", "build", "cancel"]),
    )

    assert model.workflow("trace-1").status == "RETRYABLE"
    assert model.locked_total("trace-1") == before_locked
    assert model.credit(SPONSOR) == 0
    assert model.credit(PLAN) == 0


def test_valid_provenance_does_not_require_self_referential_digest_line():
    model = seeded_workflow()
    plan = model.workflow("trace-1").steps["plan"]
    assert f"digest={plan.digest}" not in plan.artifact_text

    model.request_review(
        SPONSOR,
        "trace-1",
        ReviewResult.success(["plan", "build", "cancel"]),
    )

    assert model.workflow("trace-1").status == "SETTLED"
    assert model.locked_total("trace-1") == 0


def test_canonical_objective_is_part_of_review_context():
    model = seeded_workflow()

    context = model.review_context("trace-1")

    assert "WORKFLOW_OBJECTIVE Ship a bounded agent workflow" in context
    assert "UNTRUSTED_PROVIDER_ARTIFACT_TEXT" in context
