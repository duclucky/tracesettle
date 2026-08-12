from pathlib import Path
import ast
import re


CONTRACT = Path("contracts/tracesettle.py")
DEPENDS = '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'


def source() -> str:
    return CONTRACT.read_text(encoding="ascii")


def test_contract_source_is_ascii_and_uses_current_header():
    text = source()
    assert text.splitlines()[0] == DEPENDS
    assert "from genlayer import *" in text.splitlines()[2]


def test_contract_has_exactly_one_project_specific_gl_contract_class():
    tree = ast.parse(source())
    contract_classes = []
    for node in tree.body:
        if not isinstance(node, ast.ClassDef):
            continue
        for base in node.bases:
            if (
                isinstance(base, ast.Attribute)
                and base.attr == "Contract"
                and isinstance(base.value, ast.Name)
                and base.value.id == "gl"
            ):
                contract_classes.append(node.name)
    assert contract_classes == ["TraceSettleContract"]


def test_value_entrypoints_are_payable_and_human_units_are_gen():
    text = source()
    for method in ["create_workflow", "accept_step"]:
        pattern = rf"@gl\.public\.write\.payable\s+def {method}\("
        assert re.search(pattern, text), f"{method} must be payable"
    assert "GEN = 10 ** 18" in text
    assert re.search(r"\bwei\b", text.lower()) is None
    assert "gl.eth.send_value" not in text


def test_recovery_and_value_methods_exist():
    text = source()
    for method in [
        "request_review",
        "retry_review",
        "cancel_workflow",
        "withdraw_credit",
        "get_workflow",
        "get_workflow_step_ids",
        "get_step",
        "get_attempt",
        "get_credit",
    ]:
        assert f"def {method}(" in text


def test_review_path_fetches_evidence_checks_digest_and_maps_value():
    text = source()
    assert "import hashlib" in text
    assert "gl.nondet.web.render" in text
    assert "fetch_plan" in text
    assert "_hash_rendered_text" in text
    assert "MATERIAL_FAILURE" in text
    assert "DOWNSTREAM_BLOCKED" in text
    assert "_settle_success" in text
    assert "_settle_material_failure" in text
