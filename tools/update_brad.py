"""Build data/brad.json (the public "Where's Brad racing?" list) from a Season Planner backup file.

Usage: python3 tools/update_brad.py path/to/season-planner-backup.json
"""
import json, sys, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CLUB_KINDS = {"club", "national", "rental", "rtrack"}

def main(path):
    raw = json.load(open(path))
    data = raw.get("data", raw)
    series = {s["id"]: s for s in data.get("series", [])}
    hidden = set(data.get("hidden", []))
    today = datetime.date.today().isoformat()
    races = []
    for e in data.get("events", []):
        s = series.get(e.get("seriesId"))
        if e.get("kind") == "release" or e.get("seriesId") in hidden:
            continue
        r = e.get("racing")
        racing = r is True or (r is None and (not s or s.get("kind") not in CLUB_KINDS or s.get("racing")))
        end = e.get("end") or e["start"]
        if not racing or end < today:
            continue
        races.append({
            "id": e["id"], "seriesId": e.get("seriesId"),
            "series": (s or {}).get("name", ""), "color": (s or {}).get("color", "#E5007E"),
            "title": e.get("title", ""), "start": e["start"], "end": end,
            "location": e.get("location") or (s or {}).get("venue", ""),
        })
    races.sort(key=lambda x: (x["start"], x["title"]))
    out = {"updated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "races": races}
    (ROOT / "data" / "brad.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"{len(races)} upcoming races written to data/brad.json")

if __name__ == "__main__":
    main(sys.argv[1])
