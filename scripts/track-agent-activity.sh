#!/usr/bin/env bash
# Usage: track-agent-activity.sh <agentId> [active|idle]
# Updates ~/.openclaw/agent-activity.json
# Format: { "agentId": "active"|"idle" }

AGENT_ID="${1:-}"
STATUS="${2:-active}"

if [ -z "$AGENT_ID" ]; then
  echo "Usage: $0 <agentId> [active|idle]" >&2
  exit 1
fi

if [ "$STATUS" != "active" ] && [ "$STATUS" != "idle" ]; then
  echo "Status must be 'active' or 'idle'" >&2
  exit 1
fi

ACTIVITY_FILE="${HOME}/.openclaw/agent-activity.json"
mkdir -p "$(dirname "$ACTIVITY_FILE")"

python3 - << PYEOF
import json, os

path = "$ACTIVITY_FILE"
data = {}
if os.path.exists(path):
    try:
        with open(path) as f:
            raw = json.load(f)
        # Normalise: flatten any object entries to string
        for k, v in raw.items():
            if isinstance(v, str) and v in ('active', 'idle'):
                data[k] = v
            elif isinstance(v, dict) and 'status' in v:
                data[k] = v['status'] if v['status'] in ('active', 'idle') else 'idle'
    except Exception:
        data = {}

data["$AGENT_ID"] = "$STATUS"

with open(path, 'w') as f:
    json.dump(data, f, indent=2)
print(f"Tracked $AGENT_ID -> $STATUS")
PYEOF
