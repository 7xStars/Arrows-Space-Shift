extends RefCounted

const Space = preload("res://scripts/space_core.gd")
const Edge = preload("res://scripts/edge_core.gd")
const U = preload("res://scripts/upgrades.gd")
const MAX_STEP = 1.0 / 480.0
const EPS = 1.0e-9

static func ensure_journey(s: Dictionary, shot: Dictionary, owner: String = "") -> Dictionary:
	if shot.get("journey") is Dictionary:
		return shot.journey
	if not shot.has("objectId"):
		s.projectileSerial = int(s.get("projectileSerial", 0)) + 1
		shot.objectId = "shot:" + str(int(s.get("runSeed", 0))) + ":" + str(s.projectileSerial)
	if owner == "":
		owner = shot.get("owner", "enemy")
	shot.owner = owner
	var chapter: Dictionary = s.get("chapter", {})
	var campaign: Dictionary = s.get("campaign", {})
	var hybrid: bool = chapter.get("hybrid", false)
	var joined: bool = int(campaign.get("hybridPhase", 1)) >= 3 and float(s.get("time", 0.0)) >= float(campaign.get("hybridJoinReadyAt", campaign.get("phaseBreakUntil", 0.0)))
	var projective: bool = chapter.get("projectiveBoss", false) or chapter.get("projectiveSurface", false) or hybrid and (joined or int(campaign.get("hybridPhase", 1)) == 2 and shot.get("projective", false))
	var surface: bool = chapter.get("kind", "") == "boss" or chapter.get("kleinSurface", false)
	var family: String = "hybrid" if hybrid else "projective" if projective and surface else "klein" if surface else "route"
	var reference: String = "HYBRID-P-CENTER-V" if hybrid and projective else "HYBRID-K-V" if hybrid else "P-CENTER-V" if projective and surface else "K-V" if surface else "ROUTE-RANGE-K-V"
	var budget: float = 3400.0 if owner == "player" else 1020.0
	shot.journey = {"shotId": shot.objectId, "owner": owner, "family": family,
		"referenceId": reference, "referenceLength": 1020.0, "multiplier": budget / 1020.0,
		"budget": budget, "travel": 0.0, "launchedAt": s.get("time", 0.0)}
	shot.transportParity = int(shot.get("transportParity", 0))
	return shot.journey

static func end_shot(s: Dictionary, shot: Dictionary, cause: String, fraction: float = -1.0) -> bool:
	var journey: Dictionary = ensure_journey(s, shot)
	if journey.has("cause"):
		return false
	if fraction < 0.0:
		fraction = shot.get("journeyFraction", 1.0)
	journey.cause = cause
	journey.endedAt = s.get("time", 0.0)
	journey.endFraction = fraction
	shot.dead = true
	var event: Dictionary = {"time": s.get("time", 0.0), "type": "projectile-ended",
		"shotId": journey.shotId, "owner": journey.owner, "cause": cause,
		"x": shot.x, "z": shot.z, "travel": journey.travel, "budget": journey.budget,
		"referenceId": journey.referenceId, "fraction": fraction}
	if not s.has("events"):
		s.events = []
	s.events.append(event)
	return true

static func end_all(s: Dictionary, cause: String, owner: String = "") -> void:
	for entry in [{"key": "shots", "owner": "player"}, {"key": "enemyShots", "owner": "enemy"}]:
		if owner != "" and owner != entry.owner:
			continue
		for shot in s.get(entry.key, []):
			if not shot.get("dead", false):
				ensure_journey(s, shot, entry.owner)
				end_shot(s, shot, cause)
	for key in ["shots", "enemyShots"]:
		if s.get(key) is Array:
			s[key] = s[key].filter(func(shot): return not shot.get("dead", false))

static func _point(shot: Dictionary, context: Dictionary) -> Dictionary:
	return {"x": shot.x, "y": context.to_point.call(float(shot.z))}

static func _at(segment: Dictionary, time: float) -> Dictionary:
	var interval: float = segment.t1 - segment.t0
	var u: float = clampf((time - segment.t0) / (interval if interval != 0.0 else 1.0), 0.0, 1.0)
	return {"x": lerpf(segment["from"].x, segment.to.x, u), "y": lerpf(segment["from"].y, segment.to.y, u)}

static func _length(paths: Array) -> float:
	var result: float = 0.0
	for path in paths:
		var dx: float = path.to.x - path["from"].x
		var dy: float = path.to.y - path["from"].y
		result += sqrt(dx * dx + dy * dy)
	return result

static func _trace(point: Dictionary, end: Dictionary, context: Dictionary) -> Dictionary:
	if not context.get("surface", false):
		return {"x": end.x, "y": end.y, "crossings": [], "segments": [{"from": point, "to": end, "t0": 0.0, "t1": 1.0}]}
	var result: Dictionary = Edge.trace_projective_surface(point, end.x - point.x, end.y - point.y) if context.get("projective", false) else Edge.trace_klein(point, end.x - point.x, end.y - point.y)
	if result.segments.is_empty():
		result.segments = [{"from": {"x": result.x, "y": result.y}, "to": {"x": result.x, "y": result.y}, "t0": 0.0, "t1": 1.0}]
	return result

static func _move_trial(s: Dictionary, shot: Dictionary, dt: float, axis: float, geometry: Variant) -> Dictionary:
	var moved: Dictionary = shot.duplicate()
	moved.vz = float(moved.get("vz", -145.0)) * axis
	U.move_shot(moved, dt, s.fields, geometry)
	moved.vz /= axis
	return moved

static func _trial(s: Dictionary, shot: Dictionary, dt: float, context: Dictionary, point: Dictionary, axis: float) -> Dictionary:
	var moved: Dictionary = _move_trial(s, shot, dt, axis, context.get("geometry"))
	var end: Dictionary = _point(moved, context)
	return {"shot": moved, "from": point, "to": end, "path": _trace(point, end, context)}

static func _crossing(s: Dictionary, shot: Dictionary, crossing: Dictionary, context: Dictionary, fraction: float, representation_only: bool = false) -> void:
	var side: bool = crossing.edge in ["left", "right"]
	if side:
		shot.vz = -float(shot.get("vz", -145.0))
	elif context.get("projective", false):
		shot.vx = -float(shot.get("vx", 0.0))
	if side or context.get("projective", false):
		shot.transportParity = 1 - int(shot.get("transportParity", 0))
	shot.surfaceCrossings = int(shot.get("surfaceCrossings", 0)) + 1
	shot.lastCrossing = crossing.duplicate()
	shot.lastCrossingAt = s.time
	if context.get("clear_gates", false) and shot.has("gates"):
		shot.gates = {}
	var event: Dictionary = crossing.duplicate()
	event.merge({"time": s.time, "type": "klein-crossing", "actor": "player-shot" if shot.owner == "player" else "enemy-shot",
		"objectId": shot.objectId, "owner": shot.owner, "sourceId": shot.get("sourceId"),
		"rule": crossing.get("rule", "klein" if side else "periodic"), "fraction": fraction,
		"x": crossing.x, "z": context.from_y.call(float(crossing.y)),
		"transportParity": shot.get("transportParity", 0), "representationOnly": representation_only}, true)
	s.events.append(event)

static func _normalize(s: Dictionary, shot: Dictionary, context: Dictionary, fraction: float) -> void:
	if not context.get("surface", false):
		return
	var point: Dictionary = _point(shot, context)
	var bounds: Dictionary = Edge.KLEIN_BOUNDS
	if point.x >= bounds.left and point.x <= bounds.right and point.y >= bounds.bottom and point.y <= bounds.top:
		shot.x = float(point.x)
		shot.z = context.from_y.call(float(point.y))
		return
	var result: Dictionary = _trace(point, point, context)
	shot.x = result.x
	shot.z = context.from_y.call(float(result.y))
	for crossing in result.crossings:
		_crossing(s, shot, crossing, context, fraction, true)

static func _boundary_time(s: Dictionary, shot: Dictionary, context: Dictionary) -> float:
	var fields: Array = s.fields
	if fields.is_empty() or float(shot.get("hold", 0.0)) > EPS:
		return INF
	var vz: float = float(shot.get("vz", -145.0)) * float(context.get("axis_sign", 1.0))
	if absf(vz) < EPS:
		return INF
	if context.has("geometry"):
		return context.geometry.boundary_time(float(shot.z), vz)
	var cuts: Array = Space.boundaries(fields)
	if vz < 0.0:
		cuts.reverse()
	for boundary in cuts:
		if (float(boundary) - float(shot.z)) * signf(vz) > 1.0e-8:
			return absf(Space.space_distance(shot.z, float(boundary), fields, true) / vz)
	return INF

static func _timed_paths(paths: Array, elapsed: float, step: float, dt: float) -> Array:
	var result: Array = []
	for path in paths:
		result.append({"from": path["from"], "to": path.to, "t0": (elapsed + step * path.t0) / dt, "t1": (elapsed + step * path.t1) / dt})
	return result

static func prepared_contact(contact: Dictionary, projective: bool) -> Array:
	var cache: Dictionary = contact.path_images
	if not cache.has(projective):
		cache[projective] = Edge.prepare_contact_paths(contact.paths, Edge.KLEIN_BOUNDS, projective)
	return cache[projective]

static func _contact_time(paths: Array, contact: Dictionary, context: Dictionary) -> float:
	if contact.has("path_images"):
		return Edge.prepared_paths_time(paths, prepared_contact(contact, context.projective), contact.radius, contact.get("half_width", 0.0))
	if context.get("surface", false):
		return Edge.paths_time_projective(paths, contact.paths, contact.radius, Edge.KLEIN_BOUNDS, contact.get("half_width", 0.0)) if context.get("projective", false) else Edge.paths_time(paths, contact.paths, contact.radius, Edge.KLEIN_BOUNDS, contact.get("half_width", 0.0))
	return Edge.paths_time(paths, contact.paths, contact.radius, null, contact.get("half_width", 0.0))

static func _operation_entry(paths: Array, shot: Dictionary, receivers: Array, context: Dictionary) -> Dictionary:
	var earliest: Dictionary = {"time": INF}
	for receiver in receivers:
		if receiver.get("active") is Callable and not receiver.active.call():
			continue
		var actor: Dictionary = receiver.actor
		if U.loadout(actor).is_empty() or shot.get("gates", {}).get(receiver.key, false):
			continue
		for path in paths:
			for actor_path in receiver.paths:
				var t0: float = maxf(path.t0, actor_path.t0)
				var t1: float = minf(path.t1, actor_path.t1)
				if t1 < t0:
					continue
				var from: Dictionary = _at(path, t0)
				var to: Dictionary = _at(path, t1)
				var center_from: Dictionary = _at(actor_path, t0)
				var center_to: Dictionary = _at(actor_path, t1)
				var facing: float = float(receiver.facing) * float(context.get("axis_sign", 1.0))
				var a: float = facing * (from.y - center_from.y)
				var b: float = facing * (to.y - center_to.y)
				if a < -EPS or b > U.WARP_RADIUS + EPS or b > a + EPS or absf(from.x - center_from.x) > 500.0:
					continue
				var u: float = 0.0 if a <= U.WARP_RADIUS else clampf((a - U.WARP_RADIUS) / (a - b), 0.0, 1.0)
				var time: float = t0 + (t1 - t0) * u
				if time < float(earliest.time) - EPS:
					var center: Dictionary = _at(actor_path, time)
					earliest = {"time": time, "actor": actor, "center": {"x": center.x, "z": context.from_y.call(float(center.y))}}
	return earliest

static func advance(s: Dictionary, shot: Dictionary, dt: float, context: Dictionary) -> Dictionary:
	var result: Dictionary = {"paths": [], "physical_paths": [], "contact": false}
	if shot.get("dead", false) or dt <= 0.0:
		return result
	var journey: Dictionary = ensure_journey(s, shot, context.get("owner", ""))
	var collect_world_paths: bool = context.get("collect_world_paths", true)
	var axis_sign: float = context.get("axis_sign", 1.0)
	_normalize(s, shot, context, 0.0)
	var elapsed: float = 0.0
	var guard: int = 0
	while elapsed < dt - 1.0e-12 and not shot.get("dead", false):
		guard += 1
		if guard > 4096:
			push_error("Projectile interval exceeded the movement limit: " + str(shot.objectId))
			break
		var step: float = dt - elapsed
		if absf(float(shot.get("ax", 0.0))) > EPS and float(shot.get("curveTime", 0.0)) > EPS:
			step = minf(step, MAX_STEP)
		if float(shot.get("hold", 0.0)) > EPS:
			step = minf(step, float(shot.hold))
		elif float(shot.get("curveTime", 0.0)) > EPS:
			step = minf(step, float(shot.curveTime))
		step = minf(step, _boundary_time(s, shot, context))
		var point: Dictionary = _point(shot, context)
		var candidate: Dictionary = _trial(s, shot, step, context, point, axis_sign)
		var at_edge: bool = false
		for crossing in candidate.path.crossings:
			if crossing.time > EPS:
				continue
			at_edge = true
			shot.x = crossing.x
			shot.z = context.from_y.call(float(crossing.y))
			_crossing(s, shot, crossing, context, elapsed / dt)
		if at_edge:
			continue
		for crossing in candidate.path.crossings:
			if crossing.time <= EPS or crossing.time >= 1.0 - EPS:
				continue
			var side: bool = crossing.edge in ["left", "right"]
			var axis: String = "x" if side else "y"
			var boundary: float = Edge.KLEIN_BOUNDS[crossing.edge]
			var direction: float = signf(candidate.to[axis] - candidate["from"][axis])
			var low: float = 0.0
			var high: float = step
			for _iteration in range(45):
				var middle: float = (low + high) / 2.0
				var trial: Dictionary = _move_trial(s, shot, middle, axis_sign, context.get("geometry"))
				var position: float = trial.x if side else context.to_point.call(float(trial.z))
				if (position - boundary) * direction >= 0.0:
					high = middle
				else:
					low = middle
			step = high
			candidate = _trial(s, shot, step, context, point, axis_sign)
			candidate.to[axis] = boundary
			if side:
				candidate.shot.x = boundary
			else:
				candidate.shot.z = context.from_y.call(boundary)
			candidate.path = _trace(candidate["from"], candidate.to, context)
			break
		var paths: Array = _timed_paths(candidate.path.segments, elapsed, step, dt)
		var terminal: Dictionary = {"time": INF}
		for contact in context.get("contacts", []):
			if contact.get("active") is Callable and not contact.active.call():
				continue
			var time: float = _contact_time(paths, contact, context)
			if time < float(terminal.time) - EPS:
				terminal = {"time": time, "contact": contact}
		var operation: Dictionary = _operation_entry(paths, shot, context.get("receivers", []), context)
		var budget_time: float = INF
		var remaining: float = maxf(0.0, float(journey.budget) - float(journey.travel))
		var length: float = _length(candidate.path.segments)
		if length >= remaining - EPS:
			var low: float = 0.0
			var high: float = step
			for _iteration in range(45):
				var middle: float = (low + high) / 2.0
				if _length(_trial(s, shot, middle, context, point, axis_sign).path.segments) >= remaining:
					high = middle
				else:
					low = middle
			budget_time = (elapsed + high) / dt
		var selected: String = ""
		var time: float = (elapsed + step) / dt
		if is_finite(terminal.time) and terminal.time <= minf(budget_time, operation.time) + EPS:
			selected = "contact"
			time = terminal.time
		elif is_finite(budget_time) and budget_time <= float(operation.time) + EPS:
			selected = "journey-complete"
			time = budget_time
		elif is_finite(operation.time):
			selected = "operation"
			time = operation.time
		var used: float = clampf(time * dt - elapsed, 0.0, step)
		if used < step - 1.0e-13:
			candidate = _trial(s, shot, used, context, point, axis_sign)
			paths = _timed_paths(candidate.path.segments, elapsed, used, dt)
			length = _length(candidate.path.segments)
		var old_depth: int = Space.fold_depth_at(shot.z, s.fields)
		shot.merge(candidate.shot, true)
		shot.x = candidate.path.x
		shot.z = context.from_y.call(float(candidate.path.y))
		journey.travel += length
		for crossing in candidate.path.crossings:
			_crossing(s, shot, crossing, context, (elapsed + used * float(crossing.time)) / dt)
		result.physical_paths.append_array(paths)
		if collect_world_paths:
			for path in paths:
				result.paths.append({"from": {"x": path["from"].x, "z": context.from_y.call(float(path["from"].y))},
					"to": {"x": path.to.x, "z": context.from_y.call(float(path.to.y))}, "t0": path.t0, "t1": path.t1})
		elapsed += used
		if context.get("on_fold") is Callable:
			context.on_fold.call(shot, old_depth)
		if selected == "contact":
			result.contact = true
			shot.journeyFraction = elapsed / dt
			terminal.contact.on_hit.call(shot)
			if not journey.has("cause"):
				end_shot(s, shot, "impact", elapsed / dt)
		elif selected == "journey-complete":
			journey.travel = journey.budget
			if context.get("on_before_end") is Callable:
				context.on_before_end.call(result.physical_paths)
			end_shot(s, shot, "journey-complete", elapsed / dt)
		elif selected == "operation":
			U.apply_operations_at(s, operation.actor, shot, operation.center)
			_normalize(s, shot, context, elapsed / dt)
		elif used <= 1.0e-13:
			push_error("Projectile movement made no progress: " + str(shot.objectId))
			break
	return result
