extends RefCounted

const Data = preload("res://scripts/game_data.gd")
const PROFILE_VERSION = 5
const KNOWN_SHIPS = [0, 1, 3, 8]
const GRADE_LETTERS = ["S", "A", "B", "C", "D", "E", "—"]

static func _integer(value) -> bool:
	return (value is int or value is float) and is_finite(float(value)) and float(value) == floor(float(value))

static func _known_ship(value) -> bool:
	return _integer(value) and KNOWN_SHIPS.has(int(value))

static func _has_id(values, value) -> bool:
	if not values is Array or not _integer(value): return false
	for item in values:
		if _integer(item) and int(item) == int(value): return true
	return false

static func _count(value, limit: int = 9007199254740991) -> int:
	if not (value is int or value is float):
		return 0
	if not is_finite(float(value)) or float(value) != floor(float(value)) or value < 0 or value > limit:
		return 0
	return int(value)

static func _chapters(value) -> Array:
	var result: Array = []
	if value is Array:
		for item in value:
			if (item is int or item is float) and item == floor(item) and item >= -1 and item <= 64 and not result.has(int(item)):
				result.append(int(item))
	result.sort()
	return result

static func _unique(value: Array) -> Array:
	var result: Array = []
	for item in value:
		if not result.has(item):
			result.append(item)
	return result

static func _record(value) -> Dictionary:
	if not value is Dictionary:
		value = {}
	var clear_time = value.get("bestClearTime")
	if not (clear_time is int or clear_time is float) or not is_finite(float(clear_time)) or clear_time <= 0:
		clear_time = null
	else:
		clear_time = round(float(clear_time) * 100.0) / 100.0
	return {"bestGrade": value.get("bestGrade", "—") if GRADE_LETTERS.has(value.get("bestGrade")) else "—",
		"bestGradeScore": _count(value.get("bestGradeScore"), 100), "bestScore": _count(value.get("bestScore")),
		"bestClearTime": clear_time, "bestGrazes": _count(value.get("bestGrazes")),
		"completions": _count(value.get("completions"), 100000), "attempts": _count(value.get("attempts"), 100000),
		"lastShip": int(value.get("lastShip", 0)) if _known_ship(value.get("lastShip")) else 0,
		"lastResult": value.get("lastResult", "cleared") if ["cleared", "won", "lost"].has(value.get("lastResult")) else "cleared"}

static func _records(value) -> Dictionary:
	var result: Dictionary = {}
	if value is Dictionary:
		for key in value:
			var text: String = str(key).strip_edges()
			if (text.is_valid_float() or text.is_empty()) and (value[key] is Dictionary or value[key] is Array):
				var index: float = text.to_float()
				if _integer(index) and index >= -1 and index <= 64: result[str(int(index))] = _record(value[key])
	return result

static func _history(value) -> Array:
	var result: Array = []
	if not value is Array:
		return result
	for item in value.slice(0, 20):
		if not item is Dictionary or not _chapters([item.get("chapter")]).size() or not ["cleared", "won", "lost"].has(item.get("result")):
			continue
		result.append({"chapter": int(item.chapter), "name": str(item.get("name", "Unknown stage") if item.get("name", "Unknown stage") else "Unknown stage").left(80),
			"result": item.result, "score": _count(item.get("score")), "grazes": _count(item.get("grazes")),
			"shipId": int(item.get("shipId", 0)) if _known_ship(item.get("shipId")) else 0,
			"grade": item.get("grade", "—") if GRADE_LETTERS.has(item.get("grade")) else "—", "gradeScore": _count(item.get("gradeScore"), 100),
			"time": round(float(item.get("time", 0)) * 100.0) / 100.0 if (item.get("time") is int or item.get("time") is float) and item.get("time", -1) >= 0 and item.get("time", 1e9) < 1e9 else 0,
			"cause": str(item.get("cause", "") if item.get("cause", "") else "").left(160), "receipt": str(item.get("receipt", "") if item.get("receipt", "") else "").left(160)})
	return result

static func create_profile(value = {}) -> Dictionary:
	if not value is Dictionary:
		value = {}
	var parts: Array = []
	if value.get("driveParts") is Array:
		for part in value.driveParts:
			if ["klein-relay", "projective-module", "curvature-seed"].has(part) and not parts.has(part):
				parts.append(part)
	var recovered: bool = parts.has("klein-relay")
	var unlocked: bool = recovered and value.get("fleetUnlocked") is bool and value.get("fleetUnlocked")
	var projective: bool = parts.has("projective-module")
	var reached: Array = _chapters(value.get("reachedChapters"))
	var completed: Array = _chapters(value.get("completedChapters"))
	if recovered and not reached.has(9):
		reached.append(9)
	if projective:
		for index in range(9, 18):
			if not reached.has(index): reached.append(index)
			if not completed.has(index): completed.append(index)
		if not reached.has(18): reached.append(18)
	reached.sort()
	completed.sort()
	var earned: int = 0
	for index in Data.get_data().get("salvageChapters", []):
		if _has_id(completed, index): earned += 1
	var claimed: bool = projective and _has_id(value.get("craftedShipIds", []), 3)
	var spent: int = mini(earned, maxi(_count(value.get("fabricationSpent"), 16), 5 if claimed else 0))
	var crafted: bool = claimed and earned >= 5 and spent >= 5
	var ship_ids: Array = [0, 1, 8] if unlocked else [0]
	if crafted and unlocked: ship_ids.append(3)
	return {"version": PROFILE_VERSION, "fleetUnlocked": unlocked, "driveParts": parts if recovered else [],
		"projectiveModule": projective, "curvatureSeed": parts.has("curvature-seed"), "unlockedShips": ship_ids,
		"craftedShipIds": [3] if crafted else [], "fabricationSpent": spent,
		"selectedShip": int(value.get("selectedShip", 0)) if _has_id(ship_ids, value.get("selectedShip", 0)) else 0,
		"reachedChapters": reached, "completedChapters": completed, "stageRecords": _records(value.get("stageRecords")), "runHistory": _history(value.get("runHistory"))}

static func ship_by_id(id) -> Dictionary:
	for ship in Data.get_data().get("ships", []):
		if ship.id == id: return ship
	return Data.get_data().ships[0]

static func active_ship(state: Dictionary) -> Dictionary:
	return ship_by_id(state.get("shipId", 0))

static func unlock_klein_fleet(profile: Dictionary) -> bool:
	var changed: bool = not profile.get("fleetUnlocked", false) or not profile.get("driveParts", []).has("klein-relay")
	profile.version = PROFILE_VERSION
	profile.fleetUnlocked = true
	profile.driveParts = _unique(profile.get("driveParts", []) + ["klein-relay"])
	profile.unlockedShips = [0, 1, 8]
	if _has_id(profile.get("craftedShipIds", []), 3): profile.unlockedShips.append(3)
	profile.reachedChapters = _chapters(profile.get("reachedChapters", []) + [9])
	profile.completedChapters = _chapters(profile.get("completedChapters", []))
	profile.stageRecords = _records(profile.get("stageRecords"))
	profile.runHistory = _history(profile.get("runHistory"))
	if not _known_ship(profile.get("selectedShip")): profile.selectedShip = 0
	return changed

static func unlock_projective_module(profile: Dictionary) -> bool:
	var changed: bool = not profile.get("projectiveModule", false) or not profile.get("driveParts", []).has("projective-module")
	profile.version = PROFILE_VERSION
	profile.driveParts = _unique(profile.get("driveParts", []) + ["klein-relay", "projective-module"])
	profile.projectiveModule = true
	profile.reachedChapters = _chapters(profile.get("reachedChapters", []) + range(9, 19))
	profile.completedChapters = _chapters(profile.get("completedChapters", []) + range(9, 18))
	profile.stageRecords = _records(profile.get("stageRecords"))
	profile.runHistory = _history(profile.get("runHistory"))
	return changed

static func unlock_curvature_seed(profile: Dictionary) -> bool:
	var changed: bool = not profile.get("driveParts", []).has("curvature-seed")
	profile.driveParts = _unique(profile.get("driveParts", []) + ["curvature-seed"])
	profile.curvatureSeed = true
	return changed

static func select_ship(profile: Dictionary, id) -> bool:
	if not profile.get("fleetUnlocked", false) or not _known_ship(id) or not _has_id(profile.get("unlockedShips", []), id): return false
	profile.selectedShip = int(id)
	return true

static func mark_chapter_reached(profile: Dictionary, index) -> bool:
	if not _integer(index) or index < -1 or index > 64: return false
	var old: int = profile.get("reachedChapters", []).size()
	profile.version = PROFILE_VERSION
	profile.reachedChapters = _chapters(profile.get("reachedChapters", []) + [index])
	return old != profile.reachedChapters.size()

static func fabrication_status(profile: Dictionary) -> Dictionary:
	var earned: int = 0
	for index in Data.get_data().get("salvageChapters", []):
		if _has_id(profile.get("completedChapters", []), index): earned += 1
	var spent: int = mini(earned, _count(profile.get("fabricationSpent")))
	return {"earned": earned, "spent": spent, "available": earned - spent, "cost": 5,
		"blueprint": profile.get("driveParts", []).has("projective-module"), "crafted": _has_id(profile.get("craftedShipIds", []), 3)}

static func craft_aftwing(profile: Dictionary) -> bool:
	var status: Dictionary = fabrication_status(profile)
	if not status.blueprint or status.crafted or status.available < status.cost: return false
	profile.fabricationSpent = int(profile.get("fabricationSpent", 0)) + status.cost
	profile.craftedShipIds = _unique(profile.get("craftedShipIds", []) + [3])
	profile.unlockedShips = _unique(profile.get("unlockedShips", []) + [3])
	profile.version = PROFILE_VERSION
	return true

static func practice_chapters(profile: Dictionary) -> Array:
	var normalized: Dictionary = create_profile(profile)
	var result: Array = []
	if normalized.fleetUnlocked:
		for index in range(9, 26):
			if normalized.reachedChapters.has(index): result.append(index)
	return result

static func record_stage_result(profile: Dictionary, result: Dictionary = {}) -> bool:
	if not _integer(result.get("chapter")): return false
	var index: int = int(result.get("chapter", -99))
	if index < -1 or index > 64 or not ["cleared", "won", "lost"].has(result.get("result")): return false
	mark_chapter_reached(profile, index)
	var grade: Dictionary = result.get("grade", {})
	var score: int = _count(result.get("score"))
	var grazes: int = _count(result.get("grazes"))
	var grade_score: int = _count(grade.get("score"), 100)
	var letter: String = grade.get("letter", "—") if GRADE_LETTERS.has(grade.get("letter")) else "—"
	var records: Dictionary = _records(profile.get("stageRecords"))
	var old: Dictionary = records.get(str(index), _record({}))
	var completed: bool = result.result != "lost"
	var clear_time = null
	if completed and float(result.get("time", 0)) > 0:
		clear_time = round(float(result.time) * 100.0) / 100.0
	var best_clear = old.bestClearTime
	if clear_time != null: best_clear = clear_time if best_clear == null else minf(best_clear, clear_time)
	records[str(index)] = {"bestGrade": letter if grade_score >= old.bestGradeScore else old.bestGrade,
		"bestGradeScore": maxi(old.bestGradeScore, grade_score), "bestScore": maxi(old.bestScore, score), "bestGrazes": maxi(old.bestGrazes, grazes),
		"bestClearTime": best_clear, "completions": old.completions + int(completed), "attempts": old.attempts + 1,
		"lastShip": int(result.get("shipId", 0)) if _known_ship(result.get("shipId", 0)) else 0, "lastResult": result.result}
	profile.stageRecords = records
	if completed:
		profile.completedChapters = _chapters(profile.get("completedChapters", []) + [index])
		if index < 26: mark_chapter_reached(profile, index + 1)
	var receipt = result.get("receipt")
	if not receipt: receipt = "%s:%s:%s:%s" % [int(result.get("runSeed", 0)) if _integer(result.get("runSeed", 0)) else result.get("runSeed"), index, result.result, roundi(float(result.get("time", 0)) * 1000)]
	receipt = str(receipt)
	var entry: Dictionary = {"chapter": index, "name": str(result.get("name", "Stage %s" % index)).left(80), "result": result.result,
		"score": score, "grazes": grazes, "shipId": int(result.get("shipId", 0)) if _known_ship(result.get("shipId", 0)) else 0, "grade": letter, "gradeScore": grade_score,
		"time": float(result.get("time", 0)), "cause": str(result.get("cause", "")).left(160), "receipt": receipt}
	var history: Array = [entry]
	for item in _history(profile.get("runHistory")):
		if item.receipt != receipt: history.append(item)
	profile.runHistory = history.slice(0, 20)
	return true
