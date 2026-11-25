extends RefCounted

const Edge = preload("res://scripts/edge_core.gd")
const FIELD_LENGTH = 1200.0
const FIELD_LEAD = 120.0
const MAX_FOLDS = 3

static func metric_at(z: float, fields: Array, projectile: bool = false) -> float:
	var metric: float = 1.0
	for field in fields:
		if z >= field.start and z < field.end:
			var factor: float = field.factor
			metric *= factor * factor if projectile else factor
	return metric

static func boundaries(fields: Array) -> Array:
	var result: Array = []
	for field in fields:
		if not result.has(field.start):
			result.append(field.start)
		if not result.has(field.end):
			result.append(field.end)
	result.sort()
	return result

static func space_distance(origin: float, destination: float, fields: Array, projectile: bool = false) -> float:
	if fields.is_empty():
		return destination - origin
	if destination < origin:
		return -space_distance(destination, origin, fields, projectile)
	var distance: float = 0.0
	var start: float = origin
	for boundary in boundaries(fields):
		if boundary > origin and boundary < destination:
			distance += (float(boundary) - start) * metric_at((start + float(boundary)) / 2.0, fields, projectile)
			start = boundary
	return distance + (destination - start) * metric_at((start + destination) / 2.0, fields, projectile)

static func advance_through_space(z: float, distance: float, fields: Array, projectile: bool = false) -> float:
	var direction: float = signf(distance)
	if direction == 0.0:
		return z
	if fields.is_empty():
		return z + distance
	var remaining: float = absf(distance)
	var cuts: Array = boundaries(fields)
	if direction < 0.0:
		cuts.reverse()
	for boundary in cuts:
		if (float(boundary) - z) * direction <= 0.0:
			continue
		var metric: float = metric_at((z + float(boundary)) / 2.0, fields, projectile)
		var cost: float = absf(float(boundary) - z) * metric
		if remaining <= cost:
			return z + direction * remaining / metric
		remaining -= cost
		z = boundary
	return z + direction * remaining / metric_at(z + direction * 0.000001, fields, projectile)

static func advance_projectile(z: float, distance: float, fields: Array) -> float:
	return advance_through_space(z, distance, fields, true)

static func fold_depth_at(z: float, fields: Array) -> int:
	var depth: int = 0
	for field in fields:
		if z >= field.start and z < field.end:
			depth += 1
	return depth

static func add_fold(state: Dictionary) -> bool:
	var campaign: Dictionary = state.get("campaign", {})
	var metadata: Dictionary = state.get("chapter", {})
	var campaign_mode: bool = state.get("mode", "campaign") == "campaign"
	if campaign_mode and campaign.get("index", 0) == -1 and not ["fold", "unfold", "engage"].has(campaign.get("lesson", "")):
		return false
	var fields: Array = state.get("fields", [])
	if fields.size() >= state.get("maxFolds", MAX_FOLDS):
		return false
	var backward: bool = campaign_mode and state.get("facing", 1) == -1
	var boss: bool = campaign_mode and metadata.get("kind", "") == "boss"
	var scrolling: bool = campaign_mode and metadata.get("kind", "") == "level"
	var origin: float = state.get("cameraZ", 0.0) if scrolling and not metadata.get("kleinSurface", false) else state.get("z", 0.0)
	var entry: float = origin + FIELD_LEAD
	if boss:
		var y: float = Edge.klein_y(space_distance(0.0, entry, fields))
		if backward and absf(y - Edge.KLEIN_BOUNDS.bottom) < 0.000000001:
			y = Edge.KLEIN_BOUNDS.top
		entry = advance_through_space(0.0, y, fields)
	state.foldSerial = int(state.get("foldSerial", 0)) + 1
	var field: Dictionary = {"id": state.foldSerial, "start": entry - FIELD_LENGTH if backward else entry,
		"end": entry if backward else entry + FIELD_LENGTH, "factor": 0.5}
	fields.append(field)
	state.fields = fields
	if boss:
		var bottom: float = advance_through_space(0.0, Edge.KLEIN_BOUNDS.bottom, fields)
		var top: float = advance_through_space(0.0, Edge.KLEIN_BOUNDS.top, fields)
		field.start = maxf(field.start, bottom)
		field.end = minf(field.end, top)
	state.foldsUsed = int(state.get("foldsUsed", 0)) + 1
	return true

static func remove_fold(state: Dictionary) -> Variant:
	var fields: Array = state.get("fields", [])
	return fields.pop_back() if not fields.is_empty() else null
