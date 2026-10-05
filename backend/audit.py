"""Append-only audit trail of agent activity (output/audit_trail.json).

Every /api/chat call appends its own entries here and nothing ever gets
removed or overwritten -- the file is read, extended, and rewritten whole
each time (it's small; no DB needed), so a run that happens while another
request is mid-flight can still race on this file. That's an accepted
trade-off for a homework-scale app with one worker process; a real
multi-worker deployment would need a real log sink (file-per-process,
a queue, or a database table) instead of read-modify-write on one file.
"""

from __future__ import annotations

import json
from pathlib import Path

from models import AuditEntry

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"
AUDIT_PATH = OUTPUT_DIR / "audit_trail.json"


def append_audit_entries(entries: list[AuditEntry]) -> None:
    existing = json.loads(AUDIT_PATH.read_text(encoding="utf-8")) if AUDIT_PATH.exists() else []
    existing.extend(entry.model_dump() for entry in entries)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
