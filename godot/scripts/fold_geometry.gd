extends RefCounted

const Space = preload("res://scripts/space_core.gd")

var cuts: PackedFloat64Array
var flight_metrics := PackedFloat64Array([1.0])
var projectile_metrics := PackedFloat64Array([1.0])

func _init(fields: Array) -> void:
	cuts = PackedFloat64Array(Space.boundaries(fields))
	for cut in cuts:
		flight_metrics.append(Space.metric_at(cut, fields))
		projectile_metrics.append(Space.metric_at(cut, fields, true))

func metric_at(z: float, projectile: bool = false) -> float:
	var metrics: PackedFloat64Array = projectile_metrics if projectile else flight_metrics
	return metrics[cuts.bsearch(z, false)]

func distance(origin: float, destination: float, projectile: bool = false) -> float:
	if cuts.is_empty():
		return destination - origin
	var backwards: bool = destination < origin
	var end: float = origin if backwards else destination
	var start: float = destination if backwards else origin
	var metrics: PackedFloat64Array = projectile_metrics if projectile else flight_metrics
	var result: float = 0.0
	var i: int = cuts.bsearch(start, false)
	while i < cuts.size() and cuts[i] < end:
		var boundary: float = cuts[i]
		var midpoint: float = (start + boundary) / 2.0
		result += (boundary - start) * metrics[i + int(midpoint >= boundary)]
		start = boundary
		i += 1
	result += (end - start) * metrics[cuts.bsearch((start + end) / 2.0, false)]
	return -result if backwards else result

func advance(z: float, distance_to_move: float, projectile: bool = false) -> float:
	var direction: float = signf(distance_to_move)
	if direction == 0.0:
		return z
	if cuts.is_empty():
		return z + distance_to_move
	var metrics: PackedFloat64Array = projectile_metrics if projectile else flight_metrics
	var remaining: float = absf(distance_to_move)
	var forward: bool = direction > 0.0
	var i: int = cuts.bsearch(z, not forward) - int(not forward)
	while i >= 0 and i < cuts.size():
		var boundary: float = cuts[i]
		var midpoint: float = (z + boundary) / 2.0
		var metric: float = metrics[cuts.bsearch(midpoint, false)]
		var cost: float = absf(boundary - z) * metric
		if remaining <= cost:
			return z + direction * remaining / metric
		remaining -= cost
		z = boundary
		i += 1 if forward else -1
	return z + direction * remaining / metrics[cuts.bsearch(z + direction * 0.000001, false)]

func boundary_time(z: float, speed: float) -> float:
	var forward: bool = speed > 0.0
	var i: int = cuts.bsearch(z, not forward) - int(not forward)
	while i >= 0 and i < cuts.size():
		var boundary: float = cuts[i]
		if absf(boundary - z) > 1.0e-8:
			return absf(distance(z, boundary, true) / speed)
		i += 1 if forward else -1
	return INF
