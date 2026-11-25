extends RefCounted

const MAX_ENTRIES := 10
const MAX_SCORE := 1_000_000_000

static func new_run_id() -> String:
	return Crypto.new().generate_random_bytes(12).hex_encode()

static func valid_id(value: Variant) -> bool:
	if not value is String or value.length() != 24:
		return false
	for char in value:
		if char not in "0123456789abcdef":
			return false
	return true

static func _whole(value: Variant, minimum: int, maximum: int) -> bool:
	return (value is int or value is float) and is_finite(float(value)) and value >= minimum and value <= maximum and value == floorf(value)

static func _higher(first: Dictionary, second: Dictionary) -> bool:
	if first.score != second.score:
		return first.score > second.score
	if first.complete != second.complete:
		return first.complete
	if first.chapter != second.chapter:
		return first.chapter > second.chapter
	if first.timeMs != second.timeMs:
		return first.timeMs < second.timeMs
	return first.id < second.id

static func clean(value: Variant) -> Array:
	if not value is Array:
		return []
	var entries: Dictionary = {}
	for item in value:
		if not item is Dictionary or not valid_id(item.get("id")):
			continue
		if not _whole(item.get("score"), 0, MAX_SCORE) or not _whole(item.get("chapter"), -1, 26) or not _whole(item.get("timeMs"), 0, MAX_SCORE):
			continue
		if not item.get("complete") is bool or (item.complete and int(item.chapter) != 26):
			continue
		var record := {"id": item.id, "score": int(item.score), "chapter": int(item.chapter),
			"timeMs": int(item.timeMs), "complete": item.complete}
		if not entries.has(record.id) or _higher(record, entries[record.id]):
			entries[record.id] = record
	var sorted: Array = entries.values()
	sorted.sort_custom(_higher)
	return sorted.slice(0, MAX_ENTRIES)

static func outcome(state: Dictionary) -> Dictionary:
	var phase: String = state.get("phase", "")
	var chapter: int = state.get("campaign", {}).get("index", -1)
	var complete: bool = phase == "won" and chapter == 26 and state.get("fleetProfile", {}).get("curvatureSeed", false)
	if phase != "lost" and not complete:
		return {}
	return {"id": str(state.get("localRankId", "")), "score": clampi(int(state.get("score", 0)), 0, MAX_SCORE),
		"chapter": chapter, "timeMs": clampi(roundi(float(state.get("time", 0)) * 1000), 0, MAX_SCORE), "complete": complete}

static func position(entries: Array, id: String) -> int:
	for index in entries.size():
		if entries[index].id == id:
			return index + 1
	return 0
