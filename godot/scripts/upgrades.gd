extends RefCounted

const Space = preload("res://scripts/space_core.gd")
const WARP_RADIUS = 140.0
const EFFECT_AXES = ["Position", "Distance", "Path", "Velocity", "Arrival time", "Damage", "Utility"]
const UPGRADE_MODES = ["campaign", "upgrades", "trio", "paley", "warp-lab"]
const OPERATION_KEYS = ["position-warp", "vector-lens", "path-bend", "impact-buffer", "arrival-delay", "distance-anchor", "utility-exchange"]
const OPERATION_NAMES = ["Position Warp", "Vector Lens", "Path Bend", "Impact Buffer", "Arrival Delay", "Distance Anchor", "Utility Exchange"]

static func roster(stage: int) -> Array:
	return [0, 1, 3] if stage == 1 else [0, 1, 2, 3, 4, 5, 6]

static func counters(attack: int, defense: int) -> bool:
	return attack != defense and [1, 2, 4].has((defense - attack + 7) % 7)

static func common_counters(selected: Array, stage: int) -> Array:
	var result: Array = []
	for attack in roster(stage):
		if selected.has(attack):
			continue
		var covers: bool = true
		for defense in selected:
			if not counters(attack, defense):
				covers = false
		if covers:
			result.append(attack)
	return result

static func audit_tournament(stage: int) -> Dictionary:
	var vertices: Array = roster(stage)
	var k: int = 1 if stage == 1 else 2
	var sets: Array = []
	if k == 1:
		for vertex in vertices:
			sets.append([vertex])
	else:
		for i in range(vertices.size()):
			for j in range(i + 1, vertices.size()):
				sets.append([vertices[i], vertices[j]])
	var edges: Array = []
	var witnesses: Array = []
	var valid: bool = true
	for attack in vertices:
		for defense in vertices:
			if counters(attack, defense):
				edges.append([attack, defense])
			if attack != defense and counters(attack, defense) == counters(defense, attack):
				valid = false
	for selected in sets:
		var answers: Array = common_counters(selected, stage)
		witnesses.append({"set": selected, "counters": answers})
		if answers.is_empty():
			valid = false
	return {"stage": stage, "k": k, "vertices": vertices, "edges": edges, "witnesses": witnesses, "valid": valid,
		"claim": "Counter rule checked. Overall combat balance is not established."}

static func fold_sign(state: Dictionary) -> int:
	return -1 if state.get("fields", []).size() % 2 else 1

static func active_source_side(state: Dictionary, seed: Dictionary) -> int:
	return int(seed.polarity) * -fold_sign(state)

static func warp_side(state: Dictionary) -> Variant:
	var seed: Variant = state.get("upgrade")
	return -active_source_side(state, seed) if seed != null else null

static func seed_label(seed: Dictionary) -> String:
	return ("Right " if seed.polarity == 1 else "Left ") + OPERATION_NAMES[int(seed.type)]

static func loadout(actor: Dictionary) -> Array:
	if actor.get("equipped") is Array:
		var equipped: Array = []
		for seed in actor.equipped:
			if seed != null:
				equipped.append(seed)
		return equipped
	return [actor.upgrade] if actor.get("upgrade") != null else []

static func _event(state: Dictionary, type: String, data: Dictionary) -> void:
	var value: Dictionary = {"time": state.get("time", 0.0), "type": type}
	value.merge(data, true)
	state.events.append(value)

static func make_drop(state: Dictionary, x: float, z: float, source: String = "fixture", type: int = 0, polarity: int = 1) -> Dictionary:
	state.dropSerial = int(state.get("dropSerial", 0)) + 1
	var drop: Dictionary = {"id": state.dropSerial, "kind": OPERATION_KEYS[type], "type": type, "polarity": polarity,
		"x": x, "z": z, "source": source, "collected": false}
	state.drops.append(drop)
	_event(state, "upgrade-drop", {"drop": drop.id, "typeId": type, "polarity": polarity, "x": x, "z": z, "source": source})
	return drop

static func equip_seed(state: Dictionary, key: String, slot: Variant = null) -> bool:
	if slot == null:
		slot = int(state.get("selectedSlot", 0))
	var seed: Variant = null
	for candidate in state.inventory:
		if candidate.key == key:
			seed = candidate
			break
	if seed == null or slot < 0 or slot >= state.slotCount:
		return false
	var other: int = -1
	for i in range(state.equipped.size()):
		if state.equipped[i] != null and state.equipped[i].type == seed.type:
			other = i
			break
	if other >= 0 and other != slot:
		state.equipped[other] = null
	state.equipped[slot] = seed
	state.upgrade = state.equipped[0] if state.equipped[0] != null else state.equipped[1] if state.equipped.size() > 1 else null
	_event(state, "equip", {"key": key, "slot": slot, "typeId": seed.type})
	return true

static func collect_drop(state: Dictionary, drop: Dictionary) -> bool:
	if drop.collected:
		return false
	drop.collected = true
	var key: String = "%d:%d" % [int(drop.type), int(drop.polarity)]
	var seed: Variant = null
	for candidate in state.inventory:
		if candidate.key == key:
			seed = candidate
			break
	var duplicate: bool = seed != null
	if seed == null:
		state.upgradeSerial = int(state.get("upgradeSerial", 0)) + 1
		seed = {"key": key, "id": OPERATION_KEYS[int(drop.type)], "type": drop.type, "polarity": drop.polarity,
			"source": drop.source, "instance": state.upgradeSerial}
		state.inventory.append(seed)
	var empty: int = -1
	var existing: int = -1
	for i in range(state.equipped.size()):
		if state.equipped[i] == null and i < state.slotCount and empty < 0:
			empty = i
		if state.equipped[i] != null and state.equipped[i].type == seed.type and existing < 0:
			existing = i
	var auto_equipped: bool = existing < 0 and empty >= 0 and equip_seed(state, key, empty)
	var recycled: String = ""
	var campaign: Dictionary = state.get("campaign", {})
	var index: int = int(campaign.get("index", -1))
	if duplicate and state.get("mode", "campaign") == "campaign" and index >= 9:
		state.score += 35
		recycled = " · +35 score"
		if index < 18:
			var count: int = int(campaign.get("duplicateRepairSeeds", 0)) + 1
			campaign.duplicateRepairSeeds = count
			if not campaign.get("duplicateRepairUsed", false) and count >= 2 and state.hull < 5:
				state.hull += 1
				campaign.duplicateRepairUsed = true
				recycled += " · FIELD PATCH +1 hull"
				_event(state, "duplicate-repair", {"hull": state.hull, "count": count})
			elif not campaign.get("duplicateRepairUsed", false):
				recycled += " · field patch %d/2" % mini(2, count)
		if index >= 18 and state.get("projective") != null:
			var projective: Dictionary = state.projective
			var credits: int = int(campaign.get("duplicateEchoCredits", 0))
			if credits < 2 and projective.echoes < projective.capacity:
				projective.echoes += 1
				campaign.duplicateEchoCredits = credits + 1
				recycled += " · +1 stored echo"
	_event(state, "upgrade-collected", {"drop": drop.id, "typeId": seed.type, "polarity": seed.polarity,
		"x": drop.x, "z": drop.z, "autoEquipped": auto_equipped, "duplicate": duplicate, "recycled": recycled})
	state.lastEvent = seed_label(seed) + (" duplicate recovered" + recycled + "." if duplicate else
		" collected" + (" and equipped in the empty slot" if auto_equipped else " for Equipment") + ".")
	return true

static func move_shot(shot: Dictionary, dt: float, fields: Array, geometry: Variant = null) -> void:
	var hold: float = _number(shot.get("hold"))
	var moving: float = maxf(0.0, dt - minf(dt, hold))
	shot.hold = maxf(0.0, hold - dt)
	if moving == 0.0:
		return
	var curve_time: float = minf(moving, _number(shot.get("curveTime")))
	var vx: float = _number(shot.get("vx"))
	var ax: float = _number(shot.get("ax"))
	var vz: float = _number(shot.get("vz"), -145.0)
	var before: float = shot.z
	shot.z = geometry.advance(before, vz * moving, true) if geometry != null else Space.advance_projectile(before, vz * moving, fields)
	if vx == 0.0 and ax == 0.0:
		shot.x += 0.0
	else:
		var elapsed: float
		if geometry == null:
			elapsed = moving / Space.metric_at(shot.z, fields) if absf(vz) < 0.001 else absf(Space.space_distance(before, shot.z, fields)) / maxf(1.0, absf(vz))
		else:
			elapsed = moving / geometry.metric_at(shot.z) if absf(vz) < 0.001 else absf(geometry.distance(before, shot.z)) / maxf(1.0, absf(vz))
		shot.x += vx * elapsed + ax * curve_time * curve_time / 2.0
	shot.vx = vx + ax * curve_time
	shot.curveTime = maxf(0.0, _number(shot.get("curveTime")) - moving)
	if shot.curveTime == 0.0:
		shot.ax = 0.0

static func _number(value: Variant, fallback: float = 0.0) -> float:
	return fallback if value == null else float(value)

static func _actor_key(state: Dictionary, actor: Dictionary) -> String:
	if is_same(state, actor):
		return "player"
	var identity: Variant = actor.get("id", 0)
	return "enemy-%d" % int(identity) if identity is int or identity is float else "enemy-" + str(identity)

static func operation_entry_time(state: Dictionary, actor: Dictionary, shot: Dictionary, origin: Dictionary, old_actor: Dictionary, facing: int = 1) -> Variant:
	if loadout(actor).is_empty():
		return null
	var key: String = _actor_key(state, actor)
	var gates: Variant = shot.get("gates")
	if gates is Dictionary and gates.get(key, false):
		return null
	var a: float = facing * Space.space_distance(old_actor.z, origin.z, state.fields)
	var b: float = facing * Space.space_distance(actor.z, shot.z, state.fields)
	if a < 0.0 or b > WARP_RADIUS or b > a or absf(origin.x - old_actor.x) > 500.0:
		return null
	return 0.0 if a <= WARP_RADIUS else clampf((a - WARP_RADIUS) / (a - b), 0.0, 1.0)

static func apply_operations(state: Dictionary, actor: Dictionary, shot: Dictionary, origin: Dictionary, old_actor: Dictionary, dt: float, facing: int = 1) -> Variant:
	var entry_time: Variant = operation_entry_time(state, actor, shot, origin, old_actor, facing)
	if entry_time == null:
		return null
	var t: float = entry_time
	var center: Dictionary = {"x": old_actor.x + (actor.x - old_actor.x) * t, "z": old_actor.z + (actor.z - old_actor.z) * t}
	var entry: Dictionary = {"x": origin.x + (shot.x - origin.x) * t, "z": origin.z + (shot.z - origin.z) * t}
	shot.x = entry.x
	shot.z = entry.z
	var parts: Array = [{"from": origin, "to": entry.duplicate(), "shipFrom": old_actor, "shipTo": center, "t0": 0.0, "t1": t}]
	apply_operations_at(state, actor, shot, center)
	var landing: Dictionary = {"x": shot.x, "z": shot.z}
	move_shot(shot, dt * (1.0 - t), state.fields)
	parts.append({"from": landing, "to": {"x": shot.x, "z": shot.z}, "shipFrom": center,
		"shipTo": {"x": actor.x, "z": actor.z}, "t0": t, "t1": 1.0})
	return parts

static func apply_operations_at(state: Dictionary, actor: Dictionary, shot: Dictionary, center: Dictionary) -> bool:
	if shot.get("dead", false):
		return false
	var seeds: Array = loadout(actor)
	var key: String = _actor_key(state, actor)
	if not shot.has("gates") or shot.gates == null:
		shot.gates = {}
	if shot.gates.get(key, false):
		return false
	shot.gates[key] = true
	var applied: bool = false
	for seed in seeds:
		var relative: float = shot.x - center.x
		var source: int = 0 if absf(relative) < 8.0 else int(signf(relative))
		if source != active_source_side(state, seed):
			continue
		var resistance: Variant = null
		for attack in shot.get("payload", []):
			if counters(attack, seed.type):
				resistance = attack
				break
		if resistance != null:
			_event(state, "counter-bypass", {"actor": key, "attack": resistance, "defense": seed.type, "x": shot.x, "z": shot.z})
			continue
		var before: Dictionary = {"x": shot.x, "z": shot.z}
		match int(seed.type):
			0:
				shot.x = center.x - (shot.x - center.x)
				shot.warped = true
				shot.warpSide = -source
				state.warpCount = int(state.get("warpCount", 0)) + 1
			1:
				shot.vx = source * 140.0
				shot.vz = _number(shot.get("vz"), -145.0) * 0.75
			2:
				shot.ax = source * 320.0
				shot.curveTime = 0.8
			3:
				shot.impactDelay = 0.8
			4:
				shot.hold = 0.65
			5, 6:
				shot.vx = _number(shot.get("vx")) * 0.5
				shot.vz = _number(shot.get("vz"), -145.0) * 0.5
				if int(seed.type) == 6:
					shot.damage = (_number(shot.get("damage"), 1.0) if _number(shot.get("damage"), 1.0) != 0.0 else 1.0) * 2
					if is_same(state, actor):
						state.fireClock = maxf(0.0, state.fireClock - 0.12)
					else:
						actor.clock = maxf(0.0, actor.clock - 0.12)
		applied = true
		_event(state, "operation", {"actor": key, "typeId": seed.type, "source": source, "x": shot.x, "z": shot.z,
			"from": before, "to": {"x": shot.x, "z": shot.z}})
	if applied:
		shot.operated = true
	return applied
