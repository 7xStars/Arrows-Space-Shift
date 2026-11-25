extends RefCounted

const Data = preload("res://scripts/game_data.gd")
const Fleet = preload("res://scripts/fleet.gd")
const Ecology = preload("res://scripts/ecology.gd")
const Leaderboard = preload("res://scripts/leaderboard.gd")
const SAVE_PATH = "user://progress-v1.json"
static var _retained: Dictionary = {"actFour": null, "journey": null}

static func _parse(text: String):
	var parser: JSON = JSON.new()
	return parser.data if parser.parse(text) == OK else null

static func _retained_payload() -> Dictionary:
	for path in [SAVE_PATH, SAVE_PATH + ".bak"]:
		if not FileAccess.file_exists(path): continue
		var checked: Dictionary = _validate_payload(_parse(FileAccess.get_file_as_string(path)))
		if checked.get("ok", false): return checked.payload
	return {}

static func _qa() -> bool:
	return OS.get_cmdline_user_args().has("--qa")

static func preferences(value = {}) -> Dictionary:
	var result: Dictionary = Data.get_data().defaultPreferences.duplicate(true)
	if not value is Dictionary: return result
	for key in ["sound", "music", "juice", "reducedMotion", "showCore", "patternLabels", "manifoldCues"]:
		if value.get(key) is bool: result[key] = value[key]
	for key in ["volume", "musicVolume", "effectsVolume", "ambienceVolume"]:
		if value.get(key) is float or value.get(key) is int:
			if is_finite(float(value[key])) and value[key] >= 0 and value[key] <= 1: result[key] = float(value[key])
	return result

static func _number(value, limit: float = 1e9, integer: bool = false) -> bool:
	return (value is int or value is float) and is_finite(float(value)) and value >= 0 and value <= limit and (not integer or float(value) == floor(float(value)))

static func _ecology_value(value):
	if value == null: return null
	if value is bool and not value: return null
	if (value is int or value is float) and value == 0: return null
	if value is String and value.is_empty(): return null
	return Ecology.create_state(value if value is Dictionary else {})

static func validate_checkpoint(value) -> Dictionary:
	if value == null: return {"ok": true, "checkpoint": null}
	if not value is Dictionary or value.get("version") != 1 or not _number(value.get("seed"), 4294967295.0, true): return {"ok": false, "error": "Invalid checkpoint seed."}
	var index = value.get("chapterIndex")
	if not (index is int or index is float) or index != floor(index) or index < -1 or index > 26 or not value.get("bonusEnabled") is bool:
		return {"ok": false, "error": "Invalid checkpoint section."}
	var transition = value.get("transitionFrom")
	if transition != null and not (transition == 8 and index == 9 or transition == 17 and index == 18): return {"ok": false, "error": "Invalid checkpoint transition."}
	var entry = value.get("entry")
	if not entry is Dictionary or not entry.get("inventory") is Array or entry.inventory.size() > 14 or not entry.get("equipped") is Array or entry.equipped.size() != 2:
		return {"ok": false, "error": "Invalid checkpoint equipment."}
	var inventory: Array = []
	var keys: Array = []
	for item in entry.inventory:
		if not item is Dictionary or not _number(item.get("type"), 6, true) or not (item.get("polarity") is int or item.get("polarity") is float) or not (item.polarity == 1 or item.polarity == -1): return {"ok": false, "error": "Invalid equipment seed."}
		var key: String = "%s:%s" % [int(item.type), int(item.polarity)]
		if item.get("key") != key or keys.has(key): return {"ok": false, "error": "Duplicate or invalid equipment identity."}
		keys.append(key)
		inventory.append({"key": key, "type": int(item.type), "polarity": int(item.polarity), "id": Data.get_data().operations[int(item.type)].key, "source": "checkpoint", "instance": inventory.size() + 1})
	var equipped: Array = []
	for item_key in entry.equipped:
		if item_key is Dictionary: item_key = item_key.get("key")
		if item_key != null and not keys.has(item_key): return {"ok": false, "error": "Unavailable equipped seed."}
		equipped.append(item_key)
	if equipped[0] != null and equipped[1] != null and str(equipped[0]).split(":")[0] == str(equipped[1]).split(":")[0]: return {"ok": false, "error": "Duplicate equipped operation."}
	for key in ["score", "kills", "time", "upgradeSerial"]:
		if not _number(entry.get(key), 1e9, key != "time"): return {"ok": false, "error": "Invalid checkpoint totals."}
	var normalized: Dictionary = {"version": 1, "seed": int(value.seed), "bonusEnabled": value.bonusEnabled, "chapterIndex": int(index), "transitionFrom": transition,
		"shipId": int(value.get("shipId", 0)) if Fleet._known_ship(value.get("shipId")) else 0,
		"entry": {"inventory": inventory, "equipped": equipped, "score": int(entry.score), "kills": int(entry.kills), "time": float(entry.time),
			"upgradeSerial": maxi(int(entry.upgradeSerial), inventory.size()), "foldBonus": entry.get("foldBonus", 0) if _number(entry.get("foldBonus")) else 0,
			"foldsUsed": entry.get("foldsUsed", 0) if _number(entry.get("foldsUsed")) else 0, "projective": _ecology_value(entry.get("projective"))}}
	return {"ok": true, "checkpoint": normalized}

static func checkpoint_from_state(state: Dictionary):
	if state.is_empty() or state.get("practice", false) or state.get("mode") != "campaign" or state.get("phase") == "ready": return null
	var index: int = int(state.get("campaign", {}).get("index", -1))
	var transition = null
	var source: Dictionary = state.get("campaign", {}).get("checkpoint", {})
	if state.get("phase") == "won":
		if index == 8 and state.get("fleetProfile", {}).get("fleetUnlocked", false): transition = 8; index = 9
		elif index == 17 and state.get("fleetProfile", {}).get("projectiveModule", false): transition = 17; index = 18
		else: return null
		source = state
	elif state.get("phase") == "cleared":
		index += 1
		source = state
	if index < -1 or index > 26 or source.is_empty(): return null
	var equipped: Array = []
	for item in source.get("equipped", [null, null]): equipped.append(item.get("key") if item is Dictionary else item)
	return {"version": 1, "build": ProjectSettings.get_setting("application/config/version", ""), "seed": int(state.get("runSeed", 0)), "bonusEnabled": state.get("bonusEnabled", true),
		"chapterIndex": index, "shipId": state.get("shipId", 0), "transitionFrom": transition,
		"entry": {"inventory": source.get("inventory", []).duplicate(true), "equipped": equipped,
			"score": source.get("score", 0), "kills": source.get("kills", 0), "time": source.get("time", 0), "upgradeSerial": source.get("upgradeSerial", 0),
			"foldBonus": source.get("foldBonus", 0), "foldsUsed": source.get("foldsUsed", 0), "projective": source.get("projective")}}

static func _payload(state: Dictionary, prefs: Dictionary) -> Dictionary:
	var checkpoint = checkpoint_from_state(state)
	if state.get("phase") == "ready" and state.get("restoredCheckpoint", false):
		checkpoint = _retained_payload().get("checkpoint")
	return {"game": "Arrow Space Shift", "format": "campaign-progress", "version": 1,
		"profile": Fleet.create_profile(state.get("fleetProfile", {})), "checkpoint": checkpoint,
		"actFour": _retained.get("actFour"), "journey": _retained.get("journey"), "preferences": preferences(prefs)}

static func _write(payload: Dictionary) -> bool:
	if _qa(): return false
	if FileAccess.file_exists(SAVE_PATH):
		var previous: Dictionary = _validate_payload(_parse(FileAccess.get_file_as_string(SAVE_PATH)))
		if not previous.get("ok", false):
			if not FileAccess.file_exists(SAVE_PATH + ".bak"): return false
			var backup_bytes: String = FileAccess.get_file_as_string(SAVE_PATH + ".bak")
			if not _validate_payload(_parse(backup_bytes)).get("ok", false): return false
			var destination: String = ProjectSettings.globalize_path(SAVE_PATH)
			var quarantine: String = destination + ".rejected-%s-%s" % [Time.get_unix_time_from_system(), randi()]
			if DirAccess.rename_absolute(destination, quarantine) != OK: return false
			if DirAccess.copy_absolute(destination + ".bak", destination) != OK: return false
			if FileAccess.get_file_as_string(SAVE_PATH) != backup_bytes: return false
	var text: String = JSON.stringify(payload, "\t")
	var temporary: String = SAVE_PATH + ".tmp"
	var file = FileAccess.open(temporary, FileAccess.WRITE)
	if file == null: return false
	file.store_string(text)
	file.flush()
	var write_error: Error = file.get_error()
	file.close()
	if write_error != OK or FileAccess.get_file_as_string(temporary) != text: return false
	var check = _parse(FileAccess.get_file_as_string(temporary))
	if not check is Dictionary or not _validate_payload(check).get("ok", false): return false
	var destination: String = ProjectSettings.globalize_path(SAVE_PATH)
	var backup: String = destination + ".bak"
	if FileAccess.file_exists(SAVE_PATH):
		if FileAccess.file_exists(SAVE_PATH + ".bak") and DirAccess.remove_absolute(backup) != OK: return false
		if DirAccess.rename_absolute(destination, backup) != OK: return false
	var error: Error = DirAccess.rename_absolute(ProjectSettings.globalize_path(temporary), destination)
	if error != OK and FileAccess.file_exists(SAVE_PATH + ".bak"): DirAccess.rename_absolute(backup, destination)
	return error == OK

static func _validate_payload(payload) -> Dictionary:
	if not payload is Dictionary or payload.get("game") != "Arrow Space Shift" or not payload.get("profile") is Dictionary: return {"ok": false, "error": "Not an Arrow Space Shift progress export."}
	if payload.get("format") == "fleet-progress": return {"ok": true, "payload": {"game": "Arrow Space Shift", "format": "campaign-progress", "version": 1, "profile": Fleet.create_profile(payload.profile), "checkpoint": null,
		"actFour": _retained.get("actFour"), "journey": _retained.get("journey"), "preferences": preferences()}}
	if payload.get("format") != "campaign-progress" or payload.get("version") != 1: return {"ok": false, "error": "Unsupported progress export version."}
	if not payload.has("actFour") or not payload.has("journey"): return {"ok": false, "error": "The progress export is missing retained records."}
	var checked: Dictionary = validate_checkpoint(payload.get("checkpoint"))
	if not checked.ok: return checked
	var later = payload.get("actFour")
	if later != null and (not later is Dictionary or not _number(later.get("version"), 3, true) or later.get("version", 0) < 1 or not _number(later.get("unlocked"), 9, true)): return {"ok": false, "error": "Invalid later campaign record."}
	var journey = payload.get("journey")
	if journey != null and (not journey is Dictionary or journey.get("version") != 1): return {"ok": false, "error": "Invalid repair record."}
	var normalized := {"game": "Arrow Space Shift", "format": "campaign-progress", "version": 1,
		"profile": Fleet.create_profile(payload.profile), "checkpoint": checked.checkpoint, "actFour": later, "journey": journey,
		"preferences": preferences(payload.get("preferences", {})), "leaderboard": Leaderboard.clean(payload.get("leaderboard", []))}
	if payload.has("localRankId"):
		normalized.localRankId = payload.localRankId if Leaderboard.valid_id(payload.localRankId) else ""
	return {"ok": true, "payload": normalized}

static func _restore(payload: Dictionary) -> Dictionary:
	_retained = {"actFour": payload.get("actFour"), "journey": payload.get("journey")}
	var simulation = load("res://scripts/flight_simulation.gd").new()
	var profile: Dictionary = Fleet.create_profile(payload.get("profile", {}))
	var checked: Dictionary = validate_checkpoint(payload.get("checkpoint"))
	var saved = checked.get("checkpoint") if checked.get("ok", false) else null
	var state: Dictionary = simulation.create_flight({"fleetProfile": profile})
	if saved != null:
		if saved.transitionFrom == 8 and not profile.fleetUnlocked or saved.transitionFrom == 17 and not profile.projectiveModule:
			return {"state": state, "leaderboard": payload.get("leaderboard", []), "preferences": preferences(payload.get("preferences", {})), "error": "The checkpoint requires its recovered component."}
		state = simulation.create_flight({"seed": saved.seed, "bonusEnabled": saved.bonusEnabled, "fleetProfile": profile, "shipId": saved.shipId})
		for key in saved.entry: state[key] = saved.entry[key].duplicate(true) if saved.entry[key] is Array or saved.entry[key] is Dictionary else saved.entry[key]
		var equipped: Array = []
		for item_key in saved.entry.equipped:
			var found = null
			for item in state.inventory:
				if item.key == item_key: found = item
			equipped.append(found)
		state.equipped = equipped
		simulation.enter_chapter(state, saved.chapterIndex)
		state.phase = "paused"
		state.restoredCheckpoint = true
		state.restoredTransitionFrom = saved.transitionFrom
		state.lastEvent = "Section checkpoint restored. Your route layout, equipment, and score are ready."
	state.localRankId = payload.localRankId if saved != null and payload.has("localRankId") else Leaderboard.new_run_id()
	return {"state": state, "leaderboard": payload.get("leaderboard", []), "preferences": preferences(payload.get("preferences", {}))}

static func load_game() -> Dictionary:
	if _qa(): return {"state": {}, "preferences": preferences()}
	for path in [SAVE_PATH, SAVE_PATH + ".bak"]:
		if not FileAccess.file_exists(path): continue
		var checked: Dictionary = _validate_payload(_parse(FileAccess.get_file_as_string(path)))
		if checked.get("ok", false): return _restore(checked.payload)
	return {"state": {}, "preferences": preferences()}

static func save_game(state: Dictionary, prefs: Dictionary, scores: Variant = null) -> bool:
	if state.get("practice", false):
		var retained: Dictionary = _retained_payload()
		if retained.is_empty(): return false
		retained.preferences = preferences(prefs)
		return _write(retained)
	var payload := _payload(state, prefs)
	payload.leaderboard = Leaderboard.clean(scores) if scores != null else _retained_payload().get("leaderboard", [])
	if state.has("localRankId"):
		payload.localRankId = state.localRankId
	return _write(payload)

static func clear_checkpoint() -> void:
	if _qa(): return
	if not FileAccess.file_exists(SAVE_PATH): return
	var checked: Dictionary = _validate_payload(_parse(FileAccess.get_file_as_string(SAVE_PATH)))
	if checked.get("ok", false):
		checked.payload.checkpoint = null
		_write(checked.payload)

static func import_progress(text: String, scores: Variant = null) -> Dictionary:
	var raw = _parse(text)
	var checked: Dictionary = _validate_payload(raw)
	if not checked.get("ok", false): return checked
	var retained: Dictionary = _retained_payload()
	if raw is Dictionary and raw.get("format") == "fleet-progress":
		if not retained.is_empty():
			retained.profile = checked.payload.profile
			checked.payload = retained
	else:
		checked.payload.localRankId = ""
	checked.payload.leaderboard = Leaderboard.clean(scores) if scores != null else retained.get("leaderboard", [])
	if not _write(checked.payload): return {"ok": false, "error": "Progress could not be saved. Existing progress remains available."}
	var restored: Dictionary = _restore(checked.payload)
	restored.ok = true
	return restored

static func export_progress(state: Dictionary, prefs: Dictionary) -> String:
	if state.get("practice", false):
		var retained: Dictionary = _retained_payload()
		if not retained.is_empty():
			retained.preferences = preferences(prefs)
			retained.erase("leaderboard")
			retained.erase("localRankId")
			return JSON.stringify(retained, "\t")
	return JSON.stringify(_payload(state, prefs), "\t")
