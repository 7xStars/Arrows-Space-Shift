extends RefCounted

const KLEIN_BOUNDS = {"left": -400.0, "right": 400.0, "bottom": -70.0, "top": 950.0}
const EPS = 0.000000001

static func klein_y(y: float, bounds: Dictionary = KLEIN_BOUNDS) -> float:
	var height: float = bounds.top - bounds.bottom
	return bounds.bottom + fposmod(y - bounds.bottom, height)

static func trace_klein(point: Dictionary, dx: float, dy: float, bounds: Dictionary = KLEIN_BOUNDS) -> Dictionary:
	var left: float = bounds.left
	var right: float = bounds.right
	var bottom: float = bounds.bottom
	var top: float = bounds.top
	var width: float = right - left
	var height: float = top - bottom
	var x: float = point.x
	var y: float = point.y
	var twists: int = 0
	var crossings: Array = []
	var segments: Array = []
	while x < left or x > right:
		var edge: String = "left" if x < left else "right"
		x += width if x < left else -width
		y = bottom + top - y
		dy = -dy
		twists += 1
		crossings.append({"edge": edge, "x": x, "y": y, "time": 0.0})
	while y < bottom or y > top:
		var edge: String = "bottom" if y < bottom else "top"
		y += height if y < bottom else -height
		crossings.append({"edge": edge, "x": x, "y": y, "time": 0.0})
	var t0: float = 0.0
	var remaining: float = 1.0
	for _guard in range(128):
		var tx: float = (right - x) / dx if dx > EPS else (left - x) / dx if dx < -EPS else INF
		var ty: float = (top - y) / dy if dy > EPS else (bottom - y) / dy if dy < -EPS else INF
		var fraction: float = maxf(0.0, minf(1.0, minf(tx, ty)))
		var ending: Dictionary = {"x": x + dx * fraction, "y": y + dy * fraction}
		var t1: float = t0 + remaining * fraction
		if fraction > EPS:
			segments.append({"from": {"x": x, "y": y}, "to": ending, "t0": t0, "t1": t1})
		x = ending.x
		y = ending.y
		if fraction >= 1.0 - EPS:
			if segments.is_empty():
				segments.append({"from": {"x": x, "y": y}, "to": {"x": x, "y": y}, "t0": 0.0, "t1": 1.0})
			return {"x": x, "y": y, "twists": twists, "crossings": crossings, "segments": segments}
		dx *= 1.0 - fraction
		dy *= 1.0 - fraction
		remaining *= 1.0 - fraction
		t0 = t1
		if tx <= ty + EPS:
			var edge: String = "right" if dx >= 0.0 else "left"
			x = left if edge == "right" else right
			y = bottom + top - y
			dy = -dy
			twists += 1
			crossings.append({"edge": edge, "x": x, "y": y, "time": t0})
		else:
			var edge: String = "top" if dy >= 0.0 else "bottom"
			y = bottom if edge == "top" else top
			crossings.append({"edge": edge, "x": x, "y": y, "time": t0})
	push_error("Klein movement exceeded the crossing limit.")
	return {}

static func _at(segment: Dictionary, time: float) -> Dictionary:
	var interval: float = segment.t1 - segment.t0
	var u: float = (time - segment.t0) / (interval if interval != 0.0 else 1.0)
	return {"x": segment["from"].x + (segment.to.x - segment["from"].x) * u,
		"y": segment["from"].y + (segment.to.y - segment["from"].y) * u}

static func _image(point: Dictionary, ix: int, iy: int, bounds: Dictionary) -> Dictionary:
	return {"x": point.x + ix * (bounds.right - bounds.left),
		"y": (bounds.bottom + bounds.top - point.y if ix != 0 else point.y) + iy * (bounds.top - bounds.bottom)}

static func paths_hit(first: Array, second: Array, radius: float, bounds: Variant = null) -> bool:
	if bounds != null:
		for ix in range(-1, 2):
			for iy in range(-1, 2):
				var images: Array = []
				for segment in second:
					var copy: Dictionary = segment.duplicate()
					copy["from"] = _image(segment["from"], ix, iy, bounds)
					copy.to = _image(segment.to, ix, iy, bounds)
					images.append(copy)
				if paths_hit(first, images, radius):
					return true
		return false
	for a in first:
		for b in second:
			var t0: float = maxf(a.t0, b.t0)
			var t1: float = minf(a.t1, b.t1)
			if t1 < t0:
				continue
			var a0: Dictionary = _at(a, t0)
			var a1: Dictionary = _at(a, t1)
			var b0: Dictionary = _at(b, t0)
			var b1: Dictionary = _at(b, t1)
			var x: float = a0.x - b0.x
			var y: float = a0.y - b0.y
			var dx: float = a1.x - b1.x - x
			var dy: float = a1.y - b1.y - y
			var square: float = dx * dx + dy * dy
			var u: float = clampf(-(x * dx + y * dy) / (square if square != 0.0 else 1.0), 0.0, 1.0)
			if sqrt(pow(x + dx * u, 2.0) + pow(y + dy * u, 2.0)) <= radius:
				return true
	return false

static func _circle_entry(x: float, y: float, dx: float, dy: float, radius: float) -> float:
	var c: float = x * x + y * y - radius * radius
	if c <= EPS:
		return 0.0
	var a: float = dx * dx + dy * dy
	var b: float = 2.0 * (x * dx + y * dy)
	var discriminant: float = b * b - 4.0 * a * c
	if a <= EPS * EPS or discriminant < 0.0:
		return INF
	var time: float = (-b - sqrt(discriminant)) / (2.0 * a)
	return clampf(time, 0.0, 1.0) if time >= -EPS and time <= 1.0 + EPS else INF

static func _capsule_entry(x: float, y: float, dx: float, dy: float, radius: float, half_width: float) -> float:
	if half_width <= 0.0:
		return _circle_entry(x, y, dx, dy, radius)
	var earliest: float = minf(_circle_entry(x - half_width, y, dx, dy, radius), _circle_entry(x + half_width, y, dx, dy, radius))
	var enter: float = 0.0
	var leave: float = 1.0
	for axis in [{"position": x, "delta": dx, "limit": half_width}, {"position": y, "delta": dy, "limit": radius}]:
		if absf(axis.delta) < EPS:
			if absf(axis.position) > axis.limit:
				return earliest
		else:
			var a: float = (-axis.limit - axis.position) / axis.delta
			var b: float = (axis.limit - axis.position) / axis.delta
			enter = maxf(enter, minf(a, b))
			leave = minf(leave, maxf(a, b))
	if enter <= leave + EPS:
		earliest = minf(earliest, clampf(enter, 0.0, 1.0))
	return earliest

static func paths_time(first: Array, second: Array, radius: float, bounds: Variant = null, half_width: float = 0.0) -> float:
	return _first_contact(first, second, radius, bounds, false, half_width)

static func prepare_contact_paths(second: Array, bounds: Dictionary, projective: bool) -> Array:
	var width: float = bounds.right - bounds.left
	var height: float = bounds.top - bounds.bottom
	var sum_x: float = bounds.left + bounds.right
	var sum_y: float = bounds.bottom + bounds.top
	var image_count: int = 5 if projective else 3
	var prepared: Array = []
	for path in second:
		var images := PackedFloat64Array()
		for tx in range(image_count):
			var first_x0: float = path["from"].x
			var first_y0: float = path["from"].y
			var first_x1: float = path.to.x
			var first_y1: float = path.to.y
			if projective:
				match tx:
					1, 2:
						var offset: float = width if tx == 1 else -width
						first_x0 += offset;first_x1 += offset
						first_y0 = sum_y - first_y0;first_y1 = sum_y - first_y1
					3, 4:
						var offset: float = height if tx == 3 else -height
						first_x0 = sum_x - first_x0;first_x1 = sum_x - first_x1
						first_y0 += offset;first_y1 += offset
			else:
				var ix: int = tx - 1
				first_x0 += ix * width;first_x1 += ix * width
				if ix != 0:
					first_y0 = sum_y - first_y0;first_y1 = sum_y - first_y1
			for ty in range(image_count):
				var x0: float = first_x0
				var y0: float = first_y0
				var x1: float = first_x1
				var y1: float = first_y1
				if projective:
					match ty:
						1, 2:
							var offset: float = width if ty == 1 else -width
							x0 += offset;x1 += offset
							y0 = sum_y - y0;y1 = sum_y - y1
						3, 4:
							var offset: float = height if ty == 3 else -height
							x0 = sum_x - x0;x1 = sum_x - x1
							y0 += offset;y1 += offset
				else:
					y0 += (ty - 1) * height;y1 += (ty - 1) * height
				images.append(x0)
				images.append(y0)
				images.append(x1)
				images.append(y1)
				images.append(minf(x0, x1))
				images.append(maxf(x0, x1))
				images.append(minf(y0, y1))
				images.append(maxf(y0, y1))
		prepared.append({"t0": path.t0, "t1": path.t1, "images": images})
	return prepared

static func prepared_paths_time(first: Array, prepared: Array, radius: float, half_width: float = 0.0) -> float:
	var earliest: float = INF
	for a in first:
		var ax_from: float = a["from"].x
		var ay_from: float = a["from"].y
		var ax_delta: float = a.to.x - ax_from
		var ay_delta: float = a.to.y - ay_from
		var a_interval: float = a.t1 - a.t0
		if a_interval == 0.0:
			a_interval = 1.0
		for b in prepared:
			var t0: float = maxf(a.t0, b.t0)
			var t1: float = minf(a.t1, b.t1)
			if t1 < t0:
				continue
			var a_start: float = (t0 - a.t0) / a_interval
			var a_end: float = (t1 - a.t0) / a_interval
			var ax0: float = ax_from + ax_delta * a_start
			var ay0: float = ay_from + ay_delta * a_start
			var ax1: float = ax_from + ax_delta * a_end
			var ay1: float = ay_from + ay_delta * a_end
			var min_x: float = minf(ax0, ax1)
			var max_x: float = maxf(ax0, ax1)
			var min_y: float = minf(ay0, ay1)
			var max_y: float = maxf(ay0, ay1)
			var b_interval: float = b.t1 - b.t0
			if b_interval == 0.0:
				b_interval = 1.0
			var b_start: float = (t0 - b.t0) / b_interval
			var b_end: float = (t1 - b.t0) / b_interval
			var images: PackedFloat64Array = b.images
			for index in range(0, images.size(), 8):
				if max_x + radius + half_width + EPS < images[index + 4] or images[index + 5] + radius + half_width + EPS < min_x:
					continue
				if max_y + radius + EPS < images[index + 6] or images[index + 7] + radius + EPS < min_y:
					continue
				var bx0: float = lerpf(images[index], images[index + 2], b_start)
				var by0: float = lerpf(images[index + 1], images[index + 3], b_start)
				var bx1: float = lerpf(images[index], images[index + 2], b_end)
				var by1: float = lerpf(images[index + 1], images[index + 3], b_end)
				if max_x + radius + half_width + EPS < minf(bx0, bx1) or maxf(bx0, bx1) + radius + half_width + EPS < min_x:
					continue
				if max_y + radius + EPS < minf(by0, by1) or maxf(by0, by1) + radius + EPS < min_y:
					continue
				var x: float = ax0 - bx0
				var y: float = ay0 - by0
				var u: float = _capsule_entry(x, y, ax1 - bx1 - x, ay1 - by1 - y, radius, half_width)
				if is_finite(u):
					earliest = minf(earliest, t0 + (t1 - t0) * u)
	return earliest

static func _first_contact(first: Array, second: Array, radius: float, bounds: Variant, projective: bool, half_width: float) -> float:
	var earliest: float = INF
	var width: float = bounds.right - bounds.left if bounds != null else 0.0
	var height: float = bounds.top - bounds.bottom if bounds != null else 0.0
	var sum_x: float = bounds.left + bounds.right if bounds != null else 0.0
	var sum_y: float = bounds.bottom + bounds.top if bounds != null else 0.0
	var images: int = 5 if projective else 3 if bounds != null else 1
	for a in first:
		var ax_from: float = a["from"].x
		var ay_from: float = a["from"].y
		var ax_delta: float = a.to.x - ax_from
		var ay_delta: float = a.to.y - ay_from
		var a_interval: float = a.t1 - a.t0
		if a_interval == 0.0:a_interval = 1.0
		for b in second:
			if bounds == null:
				if maxf(a["from"].x,a.to.x)+radius+half_width+EPS<minf(b["from"].x,b.to.x) or maxf(b["from"].x,b.to.x)+radius+half_width+EPS<minf(a["from"].x,a.to.x):continue
				if maxf(a["from"].y,a.to.y)+radius+EPS<minf(b["from"].y,b.to.y) or maxf(b["from"].y,b.to.y)+radius+EPS<minf(a["from"].y,a.to.y):continue
			var t0: float = maxf(a.t0, b.t0)
			var t1: float = minf(a.t1, b.t1)
			if t1 < t0:continue
			var a_start: float = (t0 - a.t0) / a_interval
			var a_end: float = (t1 - a.t0) / a_interval
			var ax0: float = ax_from + ax_delta * a_start
			var ay0: float = ay_from + ay_delta * a_start
			var ax1: float = ax_from + ax_delta * a_end
			var ay1: float = ay_from + ay_delta * a_end
			var b_interval: float = b.t1 - b.t0
			if b_interval == 0.0:b_interval = 1.0
			var b_start: float = (t0 - b.t0) / b_interval
			var b_end: float = (t1 - b.t0) / b_interval
			for tx in range(images):
				var first_x0: float = b["from"].x
				var first_y0: float = b["from"].y
				var first_x1: float = b.to.x
				var first_y1: float = b.to.y
				if projective:
					match tx:
						1, 2:
							var offset: float = width if tx == 1 else -width
							first_x0 += offset;first_x1 += offset
							first_y0 = sum_y - first_y0;first_y1 = sum_y - first_y1
						3, 4:
							var offset: float = height if tx == 3 else -height
							first_x0 = sum_x - first_x0;first_x1 = sum_x - first_x1
							first_y0 += offset;first_y1 += offset
				elif bounds != null:
					var ix: int = tx - 1
					first_x0 += ix * width;first_x1 += ix * width
					if ix != 0:first_y0 = sum_y - first_y0;first_y1 = sum_y - first_y1
				for ty in range(images):
					var image_x0: float = first_x0
					var image_y0: float = first_y0
					var image_x1: float = first_x1
					var image_y1: float = first_y1
					if projective:
						match ty:
							1, 2:
								var offset: float = width if ty == 1 else -width
								image_x0 += offset;image_x1 += offset
								image_y0 = sum_y - image_y0;image_y1 = sum_y - image_y1
							3, 4:
								var offset: float = height if ty == 3 else -height
								image_x0 = sum_x - image_x0;image_x1 = sum_x - image_x1
								image_y0 += offset;image_y1 += offset
					elif bounds != null:
						image_y0 += (ty - 1) * height;image_y1 += (ty - 1) * height
					var bx0: float = lerpf(image_x0, image_x1, b_start)
					var by0: float = lerpf(image_y0, image_y1, b_start)
					var bx1: float = lerpf(image_x0, image_x1, b_end)
					var by1: float = lerpf(image_y0, image_y1, b_end)
					if maxf(ax0, ax1) + radius + half_width + EPS < minf(bx0, bx1) or maxf(bx0, bx1) + radius + half_width + EPS < minf(ax0, ax1):continue
					if maxf(ay0, ay1) + radius + EPS < minf(by0, by1) or maxf(by0, by1) + radius + EPS < minf(ay0, ay1):continue
					var x: float = ax0 - bx0
					var y: float = ay0 - by0
					var u: float = _capsule_entry(x, y, ax1 - bx1 - x, ay1 - by1 - y, radius, half_width)
					if is_finite(u):earliest = minf(earliest, t0 + (t1 - t0) * u)
	return earliest

# This is the existing experimental projective chart, with its distinct edge rules.
static func trace_projective_surface(point: Dictionary, dx: float, dy: float, bounds: Dictionary = KLEIN_BOUNDS) -> Dictionary:
	var left: float = bounds.left
	var right: float = bounds.right
	var bottom: float = bounds.bottom
	var top: float = bounds.top
	var x: float = point.x
	var y: float = point.y
	var twists: int = 0
	var projective_crossings: int = 0
	var crossings: Array = []
	var segments: Array = []
	while x < left or x > right:
		var edge: String = "left" if x < left else "right"
		x += right - left if x < left else left - right
		y = bottom + top - y
		dy = -dy
		twists += 1
		crossings.append({"edge": edge, "rule": "klein", "x": x, "y": y, "time": 0.0})
	while y < bottom or y > top:
		var edge: String = "bottom" if y < bottom else "top"
		y += top - bottom if y < bottom else bottom - top
		x = left + right - x
		dx = -dx
		projective_crossings += 1
		crossings.append({"edge": edge, "rule": "projective", "x": x, "y": y, "time": 0.0})
	var t0: float = 0.0
	var remaining: float = 1.0
	for _guard in range(128):
		var tx: float = (right - x) / dx if dx > EPS else (left - x) / dx if dx < -EPS else INF
		var ty: float = (top - y) / dy if dy > EPS else (bottom - y) / dy if dy < -EPS else INF
		var fraction: float = maxf(0.0, minf(1.0, minf(tx, ty)))
		var ending: Dictionary = {"x": x + dx * fraction, "y": y + dy * fraction}
		var t1: float = t0 + remaining * fraction
		if fraction > EPS:
			segments.append({"from": {"x": x, "y": y}, "to": ending, "t0": t0, "t1": t1})
		x = ending.x
		y = ending.y
		if fraction >= 1.0 - EPS:
			if segments.is_empty():
				segments.append({"from": {"x": x, "y": y}, "to": {"x": x, "y": y}, "t0": 0.0, "t1": 1.0})
			return {"x": x, "y": y, "twists": twists, "projectiveCrossings": projective_crossings,
				"crossings": crossings, "segments": segments}
		dx *= 1.0 - fraction
		dy *= 1.0 - fraction
		remaining *= 1.0 - fraction
		t0 = t1
		if tx <= ty + EPS:
			var edge: String = "right" if dx >= 0.0 else "left"
			x = left if edge == "right" else right
			y = bottom + top - y
			dy = -dy
			twists += 1
			crossings.append({"edge": edge, "rule": "klein", "x": x, "y": y, "time": t0})
		else:
			var edge: String = "top" if dy >= 0.0 else "bottom"
			y = bottom if edge == "top" else top
			x = -x
			dx = -dx
			projective_crossings += 1
			crossings.append({"edge": edge, "rule": "projective", "x": x, "y": y, "time": t0})
	push_error("Hybrid movement exceeded the crossing limit.")
	return {}

static func trace_klein_projective(point: Dictionary, dx: float, dy: float, bounds: Dictionary = KLEIN_BOUNDS) -> Dictionary:
	return trace_projective_surface(point, dx, dy, bounds)

static func _projective_image(point: Dictionary, move: int, bounds: Dictionary) -> Dictionary:
	match move:
		1:
			return {"x": point.x + bounds.right - bounds.left, "y": bounds.bottom + bounds.top - point.y}
		2:
			return {"x": point.x - bounds.right + bounds.left, "y": bounds.bottom + bounds.top - point.y}
		3:
			return {"x": bounds.left + bounds.right - point.x, "y": point.y + bounds.top - bounds.bottom}
		4:
			return {"x": bounds.left + bounds.right - point.x, "y": point.y - bounds.top + bounds.bottom}
	return point

static func paths_hit_projective(first: Array, second: Array, radius: float, bounds: Dictionary = KLEIN_BOUNDS) -> bool:
	var width: float = bounds.right - bounds.left
	var height: float = bounds.top - bounds.bottom
	var sum_x: float = bounds.left + bounds.right
	var sum_y: float = bounds.bottom + bounds.top
	var box_radius: float = radius + EPS
	for a in first:
		var ax_from: float = a["from"].x
		var ay_from: float = a["from"].y
		var ax_delta: float = a.to.x - ax_from
		var ay_delta: float = a.to.y - ay_from
		var a_interval: float = a.t1 - a.t0
		if a_interval == 0.0: a_interval = 1.0
		for b in second:
			var t0: float = maxf(a.t0, b.t0)
			var t1: float = minf(a.t1, b.t1)
			if t1 < t0: continue
			var a_start: float = (t0 - a.t0) / a_interval
			var a_end: float = (t1 - a.t0) / a_interval
			var ax0: float = ax_from + ax_delta * a_start
			var ay0: float = ay_from + ay_delta * a_start
			var ax1: float = ax_from + ax_delta * a_end
			var ay1: float = ay_from + ay_delta * a_end
			var a_min_x: float = minf(ax0, ax1)
			var a_max_x: float = maxf(ax0, ax1)
			var a_min_y: float = minf(ay0, ay1)
			var a_max_y: float = maxf(ay0, ay1)
			var bx_from: float = b["from"].x
			var by_from: float = b["from"].y
			var bx_to: float = b.to.x
			var by_to: float = b.to.y
			var b_interval: float = b.t1 - b.t0
			if b_interval == 0.0: b_interval = 1.0
			var b_start: float = (t0 - b.t0) / b_interval
			var b_end: float = (t1 - b.t0) / b_interval
			for tx in range(5):
				var first_x0: float = bx_from
				var first_y0: float = by_from
				var first_x1: float = bx_to
				var first_y1: float = by_to
				match tx:
					1, 2:
						var offset: float = width if tx == 1 else -width
						first_x0 += offset
						first_x1 += offset
						first_y0 = sum_y - first_y0
						first_y1 = sum_y - first_y1
					3, 4:
						var offset: float = height if tx == 3 else -height
						first_x0 = sum_x - first_x0
						first_x1 = sum_x - first_x1
						first_y0 += offset
						first_y1 += offset
				for ty in range(5):
					var image_x0: float = first_x0
					var image_y0: float = first_y0
					var image_x1: float = first_x1
					var image_y1: float = first_y1
					match ty:
						1, 2:
							var offset: float = width if ty == 1 else -width
							image_x0 += offset
							image_x1 += offset
							image_y0 = sum_y - image_y0
							image_y1 = sum_y - image_y1
						3, 4:
							var offset: float = height if ty == 3 else -height
							image_x0 = sum_x - image_x0
							image_x1 = sum_x - image_x1
							image_y0 += offset
							image_y1 += offset
					# The padded box can reject only separated paths. The exact test keeps the original radius.
					if a_max_x + box_radius < minf(image_x0, image_x1) or maxf(image_x0, image_x1) + box_radius < a_min_x:
						continue
					if a_max_y + box_radius < minf(image_y0, image_y1) or maxf(image_y0, image_y1) + box_radius < a_min_y:
						continue
					var bx_delta: float = image_x1 - image_x0
					var by_delta: float = image_y1 - image_y0
					var bx0: float = image_x0 + bx_delta * b_start
					var by0: float = image_y0 + by_delta * b_start
					var bx1: float = image_x0 + bx_delta * b_end
					var by1: float = image_y0 + by_delta * b_end
					var x: float = ax0 - bx0
					var y: float = ay0 - by0
					var dx: float = ax1 - bx1 - x
					var dy: float = ay1 - by1 - y
					var square: float = dx * dx + dy * dy
					var u: float = clampf(-(x * dx + y * dy) / (square if square != 0.0 else 1.0), 0.0, 1.0)
					if sqrt(pow(x + dx * u, 2.0) + pow(y + dy * u, 2.0)) <= radius:
						return true
	return false

static func paths_time_projective(first: Array, second: Array, radius: float, bounds: Dictionary = KLEIN_BOUNDS, half_width: float = 0.0) -> float:
	return _first_contact(first, second, radius, bounds, true, half_width)
