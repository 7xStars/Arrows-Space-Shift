extends Control

const Space = preload("res://scripts/space_core.gd")
const FoldGeometry = preload("res://scripts/fold_geometry.gd")
const Edge = preload("res://scripts/edge_core.gd")
const Operations = preload("res://scripts/upgrades.gd")
const Campaign = preload("res://scripts/campaign.gd")
const Data = preload("res://scripts/game_data.gd")
const Ecology = preload("res://scripts/ecology.gd")
const IVORY := Color("f0e4bd")
const BRASS := Color("b4a170")
const TEAL := Color("96c7ca")
const BLUE := Color("79aade")
const ORANGE := Color("e67f4e")
const VIOLET := Color("c88cff")
const MUTED := Color("87929b")
const RESOURCE := Color("91bf71")
const PART_BACKING := Color("071014")
const ENTRY_TIME: float = 0.65
const ROUND_SHOT_SAMPLES: float = 4.0
const ROUND_SHOT_RING_STEP: float = TAU / 15.0

var state: Dictionary = {}
var preferences: Dictionary = {}
var atlas: Texture2D
var manifest: Dictionary = {}
var bank: float = 0.0
var engine_gain: float = 1.0
var wake: Array = []
var motion_clock: float = 0.0
var last_time: float = -1.0
var last_position := Vector2.ZERO
var last_facing: int = 1
var last_chapter: int = -999
var last_seed: int = -1
var last_scale: float = -1.0
var last_travel: float = 0.0
var next_wake: float = 0.0
var event_cursor: int = 0
var last_fire: float = -100.0
var last_hit: float = -100.0
var last_world_z: float = 0.0
var travel_gain: float = 1.0
var visual_events: Array = []
var _font: Font = ThemeDB.fallback_font
var arena_clip: Control
var steering_draw_probe: Callable
var world_canvas: Control
var _paint: CanvasItem
var _round_shot_scale: float = -1.0
var _round_shot_textures: Dictionary[float, Texture2D] = {}
var _projective_shot_texture: Texture2D
var _layout_size := Vector2(-1.0, -1.0)
var _layout_cache: Dictionary = {}
var _projection_active: bool = false
var _projection_geometry: FoldGeometry
var _projection_boss: bool
var _projection_origin: float
var _projection_direction: int
var _projection_center_x: float
var _projection_zero_y: float
var _projection_scale: float

func _ready() -> void:
	_projective_shot_texture = _make_projective_shot_texture()
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	clip_contents = true
	manifest = Data.get_data().get("spriteManifest", {})
	if ResourceLoader.exists("res://assets/crossing/atlas.png"):
		atlas = load("res://assets/crossing/atlas.png")
	arena_clip = Control.new()
	arena_clip.name = "ArenaClip"
	arena_clip.clip_contents = true
	arena_clip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(arena_clip)
	world_canvas = Control.new()
	world_canvas.name = "WorldCanvas"
	world_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	world_canvas.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	arena_clip.add_child(world_canvas)
	world_canvas.draw.connect(_draw_world)
	resized.connect(reset_motion)
	resized.connect(_update_arena_clip)
	_update_arena_clip()

func set_state(value: Dictionary) -> void:
	state = value
	queue_redraw()

func _process(_delta: float) -> void:
	if state.is_empty():
		return
	update_motion()
	queue_redraw()
	world_canvas.queue_redraw()

func _update_arena_clip() -> void:
	if not is_instance_valid(arena_clip):
		return
	var box: Dictionary = _view_layout()
	arena_clip.position = Vector2(box.left, box.top)
	arena_clip.size = Vector2(box.width, box.height)
	world_canvas.position = -arena_clip.position
	world_canvas.size = size

func chapter() -> Dictionary:
	return state.get("chapter", {})

func is_boss() -> bool:
	return chapter().get("kind", "") == "boss"

func is_surface() -> bool:
	return bool(chapter().get("kleinSurface", false))

func view_direction() -> int:
	return int(state.get("facing", 1)) if is_boss() or is_surface() else 1

func view_origin() -> float:
	if is_boss():
		return float(state.get("z", 0.0))
	if is_surface():
		return float(state.get("surfaceViewZ", 0.0))
	return float(state.get("cameraZ", 0.0))

func view_y(z: float) -> float:
	if _projection_active:
		var distance: float = _projection_geometry.distance(_projection_origin, z) if _projection_geometry != null else z - _projection_origin
		var chart_y: float = _projection_direction * distance
		return Edge.klein_y(chart_y) if _projection_boss else chart_y
	var value: float = view_direction() * Space.space_distance(view_origin(), z, state.get("fields", []))
	return Edge.klein_y(value) if is_boss() else value

func layout() -> Dictionary:
	return _view_layout().duplicate()

func _view_layout() -> Dictionary:
	if size == _layout_size:
		return _layout_cache
	var usable: float = maxf(1.0, size.y - 36.0)
	var scale: float = minf(maxf(1.0, size.x - 18.0) / 800.0, usable / 1020.0)
	var width: float = 800.0 * scale
	var height: float = 1020.0 * scale
	var top: float = (size.y - height) * 0.5
	_layout_size = size
	_layout_cache = {"scale": scale, "left": (size.x - width) * 0.5, "right": (size.x + width) * 0.5,
		"top": top, "bottom": top + height, "zeroY": top + 950.0 * scale, "width": width, "height": height}
	return _layout_cache

func project(x: float, z: float) -> Vector2:
	if _projection_active:
		return chart_point(x, view_y(z))
	var box: Dictionary = _view_layout()
	return Vector2(size.x * 0.5 + x * float(box.scale), float(box.zeroY) - view_y(z) * float(box.scale))

func chart_point(x: float, y: float) -> Vector2:
	if _projection_active:
		return Vector2(_projection_center_x + x * _projection_scale, _projection_zero_y - y * _projection_scale)
	var box: Dictionary = _view_layout()
	return Vector2(size.x * 0.5 + x * float(box.scale), float(box.zeroY) - y * float(box.scale))

func in_combat_view(actor: Dictionary) -> bool:
	var y: float = view_y(float(actor.get("z", 0.0)))
	var x: float = float(actor.get("x", 0.0))
	return x >= -372.0 and x <= 372.0 and y >= -42.0 and y <= 922.0

func acknowledge_visible() -> void:
	if state.is_empty() or state.get("phase", "") != "running":
		return
	for enemy in state.get("enemies", []):
		if float(enemy.get("hp", 0)) <= 0 or bool(enemy.get("escaped", false)) or int(enemy.get("stage", 0)) > int(state.get("stage", 0)):
			continue
		if enemy.get("routeActive", true) == false or enemy.get("waveActive", true) == false:
			continue
		if in_combat_view(enemy) and not bool(enemy.get("presented", false)):
			enemy.presented = true
			enemy.visibleFor = 0.0
			if is_boss():
				enemy.lastViewY = view_y(float(enemy.z))
			state.get("events", []).append({"time": state.get("time", 0.0), "type": "enemy-presented", "target": enemy.get("id", 0), "x": enemy.x, "z": enemy.z})
	for rock in state.get("asteroids", []):
		rock.presented = float(rock.get("hp", 0)) > 0 and in_combat_view(rock)

func active_ship() -> Dictionary:
	for ship in Data.get_data().get("ships", []):
		if int(ship.get("id", 0)) == int(state.get("shipId", 0)):
			return ship
	return {"sprite": "player.arrow", "speed": 360.0, "coreRadius": 18.0, "exhaust": {"nativeSize": 32.0, "width": 14.0, "length": 24.0, "nozzles": [{"x": 0.0, "y": 13.0}]}}

func motion_enabled() -> bool:
	return bool(preferences.get("juice", true)) and not bool(preferences.get("reducedMotion", false))

func reset_motion() -> void:
	bank = 0.0
	engine_gain = 1.0
	wake.clear()
	motion_clock = 0.0
	next_wake = 0.0
	last_time = -1.0
	event_cursor = 0
	visual_events.clear()
	queue_redraw()

func update_motion() -> void:
	var time: float = float(state.get("time", 0.0))
	var current: Vector2 = project(float(state.get("x", 0.0)), float(state.get("z", 0.0)))
	var index: int = int(state.get("campaign", {}).get("index", -1))
	var facing: int = int(state.get("facing", 1))
	var scale: float = float(_view_layout().scale)
	var dt: float = time - last_time if last_time >= 0 else 0.0
	var travel: float = float(state.get("campaign", {}).get("scrollDistance", 0.0)) if is_boss() else float(state.get("cameraZ", 0.0))
	var fresh: bool = last_time < 0.0 or dt < 0.0 or dt > 0.25 or index != last_chapter or int(state.get("runSeed", 0)) != last_seed or facing != last_facing or not is_equal_approx(scale, last_scale)
	fresh = fresh or current.distance_to(last_position) > maxf(90.0, 760.0 * maxf(0.0, dt) + 8.0) * scale
	fresh = fresh or absf(float(state.get("z", 0.0)) - last_world_z) > maxf(120.0, 1440.0 * maxf(0.0, dt))
	if fresh:
		bank = 0.0
		engine_gain = 1.0
		wake.clear()
		motion_clock = 0.0
		next_wake = 0.0
		event_cursor = state.get("events", []).size()
		visual_events.clear()
		var recent_events: Array = state.get("events", [])
		for i in range(recent_events.size() - 1, -1, -1):
			var event: Dictionary = recent_events[i]
			if time - float(event.get("time", time)) > 0.7:
				break
			if event.get("type", "") in ["player-fire", "enemy-fire", "damage", "impact-absorbed", "contact-absorbed", "operation"]:
				visual_events.push_front(event.duplicate(true))
				if visual_events.size() >= 64:
					break
	if not motion_enabled():
		bank = 0.0
		engine_gain = 1.0
		wake.clear()
	elif not fresh and state.get("phase", "") == "running" and dt > 0:
		motion_clock += dt
		var steer: float = clampf(float(state.get("lateralVelocity", 0.0)) / maxf(1.0, float(active_ship().get("speed", 360.0))), -1.0, 1.0)
		var desired: float = steer * 0.16
		var seconds: float = 0.06 if absf(desired) > absf(bank) else 0.14
		bank = desired + (bank - desired) * exp(-dt / seconds)
		travel_gain = clampf(absf(travel - last_travel) / maxf(0.0001, 90.0 * dt), 0.0, 4.0)
		var target: float = 0.88 + minf(1.0, travel_gain) * 0.12 + absf(steer) * 0.22 + clampf((travel_gain - 1.0) / 3.0, 0.0, 1.0) * 0.36
		engine_gain = target + (engine_gain - target) * exp(-dt / 0.085)
		while not wake.is_empty() and motion_clock - float(wake[0].time) >= 0.18:
			wake.pop_front()
		if motion_clock >= next_wake and (travel_gain > 0.1 or absf(steer) > 0.08):
			wake.append({"position": current, "time": motion_clock, "bank": bank, "gain": travel_gain})
			if wake.size() > 10:
				wake.pop_front()
			next_wake = motion_clock + 1.0 / 45.0
	var events: Array = state.get("events", [])
	if event_cursor > events.size():
		event_cursor = 0
	for i in range(event_cursor, events.size()):
		if events[i].get("type", "") in ["player-fire", "enemy-fire", "damage", "impact-absorbed", "contact-absorbed", "operation"]:
			visual_events.append(events[i].duplicate(true))
			if visual_events.size() > 64:
				visual_events.pop_front()
		if events[i].get("type", "") == "player-fire":
			last_fire = float(events[i].get("time", time))
		elif events[i].get("type", "") == "damage":
			last_hit = float(events[i].get("time", time))
	event_cursor = events.size()
	while not visual_events.is_empty() and time - float(visual_events[0].get("time", 0)) > 0.7:
		visual_events.pop_front()
	last_position = current
	last_time = time
	last_travel = travel
	last_world_z = float(state.get("z", 0.0))
	last_facing = facing
	last_scale = scale
	last_chapter = index
	last_seed = int(state.get("runSeed", 0))

func _draw() -> void:
	_paint = self
	_paint.draw_rect(Rect2(Vector2.ZERO, size), Color.BLACK)
	if state.is_empty():
		return
	var box: Dictionary = _view_layout()
	_draw_stars(box)
	var marker: String = _frame_marker()
	var frame: String = "+" if int(state.get("facing", 1)) > 0 else "-"
	var font_size: int = 8 if float(box.width) < 280 else 10
	_text(marker + " · FRAME " + frame + " · CORE: LIVE · SQUARES: DEPTH", Vector2(box.left + 9, box.bottom + 12), TEAL, font_size, false)

func _begin_draw_projection(box: Dictionary) -> void:
	var fields: Array = state.get("fields", [])
	_projection_geometry = FoldGeometry.new(fields) if not fields.is_empty() else null
	_projection_boss = is_boss()
	_projection_origin = view_origin()
	_projection_direction = view_direction()
	_projection_center_x = size.x * 0.5
	_projection_zero_y = float(box.zeroY)
	_projection_scale = float(box.scale)
	_projection_active = true

func _end_draw_projection() -> void:
	_projection_active = false
	_projection_geometry = null

func _draw_world() -> void:
	if state.is_empty():
		return
	_paint = world_canvas
	var box: Dictionary = _view_layout()
	_begin_draw_projection(box)
	var arena := Rect2(Vector2(box.left, box.top), Vector2(box.width, box.height))
	_draw_grid(box)
	_draw_folds(box)
	_draw_wake()
	_draw_edges(box)
	_draw_rocks()
	_draw_drops()
	_draw_telegraphs()
	_draw_enemies()
	_draw_effects()
	_draw_crossing_notice()
	_draw_terminal_marks()
	_draw_reward(box)
	_draw_shots()
	_draw_player()
	_draw_debts()
	_paint.draw_rect(arena, Color("534a32"), false, 1.0)
	if float(state.get("countdown", 0.0)) > 0:
		_text("%d" % ceili(float(state.countdown)), Vector2(size.x * 0.5, size.y * 0.5), IVORY, 38)
	_end_draw_projection()
	_paint = self

func _draw_stars(box: Dictionary) -> void:
	var time: float = float(state.get("time", 0.0))
	var progress: float = clampf((float(state.get("campaign", {}).get("index", -1)) + 1.0) / 27.0, 0.0, 1.0)
	var count: int = int(30 + progress * 100)
	for i in range(count):
		var x: float = fposmod(sin(float(i * 127 + 5)) * 43758.5453, 1.0) * size.x
		var y: float = fposmod(fposmod(sin(float(i * 79 + 19)) * 12117.181, 1.0) * size.y + time * float(3 + i % 5), maxf(1.0, size.y))
		var star := Color("a7b2b8")
		star.a = 0.18 + (i % 4) * 0.08
		var streak: float = minf(6.0, maxf(0.0, travel_gain - 1.0) * 1.6) if motion_enabled() and x >= box.left and x <= box.right and i % 5 == 0 else 0.0
		_paint.draw_line(Vector2(floor(x), floor(y)), Vector2(floor(x), floor(y) + 1.0 + streak), star, 1.0)

func _draw_grid(box: Dictionary) -> void:
	var origin: float = view_origin()
	var first: float = floorf(origin / 180.0) * 180.0 - 180.0
	for i in range(18):
		var p: Vector2 = project(0.0, first + i * 180.0)
		if p.y >= box.top and p.y <= box.bottom:
			_paint.draw_line(Vector2(box.left, p.y), Vector2(box.right, p.y), Color("293032"), 1.0)
	for x in [-300, -200, -100, 0, 100, 200, 300]:
		var px: float = chart_point(float(x), 0).x
		_paint.draw_line(Vector2(px, box.top), Vector2(px, box.bottom), Color(0.12, 0.17, 0.18, 0.22), 1.0)

func _draw_folds(box: Dictionary) -> void:
	var intervals: Array = []
	var cuts: Array = []
	for field in state.get("fields", []):
		for interval in _field_intervals(float(field.start), float(field.end)):
			intervals.append(interval)
			for edge in [float(interval.start), float(interval.end)]:
				if not cuts.has(edge):
					cuts.append(edge)
	cuts.sort()
	for index in range(cuts.size() - 1):
		var lo: float = float(cuts[index])
		var hi: float = float(cuts[index + 1])
		var midpoint: float = (lo + hi) * 0.5
		var depth: int = 0
		for interval in intervals:
			if midpoint > float(interval.start) and midpoint < float(interval.end):
				depth += 1
		if depth == 0:
			continue
		var top: float = chart_point(0, hi).y
		var bottom: float = chart_point(0, lo).y
		_paint.draw_rect(Rect2(Vector2(box.left, top), Vector2(box.width, bottom - top)), Color(0.9, 0.6, 0.15, 0.025 + depth * 0.012))
		_paint.draw_line(Vector2(box.left, top), Vector2(box.right, top), Color(BRASS, 0.65), 1.0)
		_paint.draw_line(Vector2(box.left, bottom), Vector2(box.right, bottom), Color(BRASS, 0.65), 1.0)
		if bottom - top >= 18:
			for pip in range(depth):
				_paint.draw_rect(Rect2(Vector2(box.left + 9 + pip * 6, bottom - 10), Vector2(3, 3)), BRASS)
			var band_label := "DEPTH %d · SHOT SPEED BOTH WAYS ×%d" if Campaign.is_tutorial(state) else "DEPTH %d · SHOTS ×%d"
			_text(band_label % [depth, int(pow(2, depth))], Vector2(box.left + 34, bottom - 7), BRASS, 9, false)

func _field_intervals(start: float, finish: float) -> Array:
	if not is_boss():
		var a: float = view_y(start)
		var b: float = view_y(finish)
		var lo: float = maxf(-70.0, minf(a, b))
		var hi: float = minf(950.0, maxf(a, b))
		return [{"start": lo, "end": hi}] if hi > lo else []
	var lo: float = maxf(-70.0, minf(Campaign.arena_y(state, start), Campaign.arena_y(state, finish)))
	var hi: float = minf(950.0, maxf(Campaign.arena_y(state, start), Campaign.arena_y(state, finish)))
	if hi <= lo:
		return []
	var length: float = hi - lo
	if length >= 1020.0 - 0.000000001:
		return [{"start": -70.0, "end": 950.0}]
	var camera: float = Campaign.arena_y(state, float(state.get("z", 0)))
	var a: float = view_direction() * (lo - camera)
	var b: float = view_direction() * (hi - camera)
	var first: float = Edge.klein_y(minf(a, b))
	var last: float = first + length
	return [{"start": first, "end": last}] if last <= 950.0 else [{"start": first, "end": 950.0}, {"start": -70.0, "end": -70.0 + last - 950.0}]

func _draw_edges(box: Dictionary) -> void:
	if not (is_boss() or is_surface() or chapter().get("klein", false)):
		return
	var projective: bool = chapter().get("projectiveSurface", false) or chapter().get("projectiveBoss", false) or Campaign.hybrid_active(state)
	for side in [box.left + 2.0, box.right - 2.0]:
		_paint.draw_line(Vector2(side, box.top + 24), Vector2(side, box.bottom - 24), Color(BRASS, 0.6), 1.2)
		for offset in [0.24, 0.5, 0.76]:
			var y: float = float(box.top) + float(box.height) * float(offset)
			_paint.draw_polyline(PackedVector2Array([Vector2(side - 4, y - 5), Vector2(side + 3, y), Vector2(side - 4, y + 5)]), BRASS, 1.3, true)
	for edge in [float(box.top) + 2, float(box.bottom) - 2]:
		for offset in [0.24, 0.5, 0.76]:
			var p := Vector2(float(box.left) + float(box.width) * float(offset), edge)
			if projective:
				_paint.draw_polyline(PackedVector2Array([p + Vector2(-8, -3), p + Vector2(-4, 2), p + Vector2(0, -3)]), VIOLET, 1.3, true)
				_paint.draw_polyline(PackedVector2Array([p + Vector2(0, 3), p + Vector2(4, -2), p + Vector2(8, 3)]), VIOLET, 1.3, true)
			else:
				_paint.draw_line(p + Vector2(-7, -2), p + Vector2(7, -2), TEAL, 1.3)
				_paint.draw_line(p + Vector2(-7, 2), p + Vector2(7, 2), TEAL, 1.3)
	_text("GOLD SIDE: TURN · " + ("VIOLET END: MIRROR" if projective else "TEAL END: CONTINUE"), Vector2(size.x * 0.5, box.top + 15), IVORY, 9)

func _draw_wake() -> void:
	if not motion_enabled():
		return
	var scale: float = float(_view_layout().scale)
	var engine: Dictionary = active_ship().get("exhaust", {})
	for sample in wake:
		var age: float = motion_clock - float(sample.time)
		var fade: float = clampf(1.0 - age / 0.18, 0.0, 1.0)
		var direction := Vector2(0, 1).rotated(float(sample.bank))
		for nozzle in engine.get("nozzles", [{"x": 0, "y": 13}]):
			var offset := Vector2(float(nozzle.x), float(nozzle.y)) * 56.0 / float(engine.get("nativeSize", 32.0)) * scale
			offset += Vector2(0, age * (75.0 + float(sample.gain) * 35.0) * scale)
			var point: Vector2 = sample.position + offset.rotated(float(sample.bank))
			_paint.draw_line(point, point + direction * (3.0 + minf(3.0, float(sample.gain)) * 1.5) * scale, Color(TEAL, 0.18 * fade * fade), maxf(0.7, 1.3 * scale))

func _draw_rocks() -> void:
	for rock in state.get("asteroids", []):
		if float(rock.get("hp", 0)) <= 0 or not in_combat_view(rock):
			continue
		var radius: float = float(rock.get("radius", 24.0)) * float(_view_layout().scale)
		_sprite("asteroid.large" if radius > 16.0 else "asteroid.medium", project(float(rock.x), float(rock.z)), Vector2.ONE * radius * 2.25)

func _draw_drops() -> void:
	var operations: Array = Data.get_data().get("operations", [])
	for drop in state.get("drops", []):
		if drop.get("collected", false) or not in_combat_view(drop):
			continue
		var type: int = clampi(int(drop.get("type", 0)), 0, maxi(0, operations.size() - 1))
		var operation: Dictionary = operations[type] if not operations.is_empty() else {}
		var color := Color(operation.get("color", "#b4a170"))
		var p: Vector2 = project(float(drop.x), float(drop.z))
		var radius: float = maxf(7.0, 14.0 * float(_view_layout().scale))
		_diamond(p, radius, color, false)
		_sprite("seed." + str(operation.get("code", "p")).to_lower(), p, Vector2.ONE * radius * 1.8)
		_text(("R" if int(drop.get("polarity", 1)) == 1 else "L") + " · " + str(operation.get("code", "P")), p - Vector2(0, radius + 6), color, 10)

func _draw_reward(box: Dictionary) -> void:
	if state.get("phase", "") == "won":
		return
	var campaign: Dictionary = state.get("campaign", {})
	var part: Variant = campaign.get("repairPart")
	if part is Dictionary and not bool(part.get("collected", false)):
		var p: Vector2 = project(float(part.get("x", 0)), float(part.get("z", 0)))
		var radius: float = maxf(11.0, 20.0 * float(box.scale))
		_paint.draw_circle(p, radius + 3.0, PART_BACKING)
		_paint.draw_arc(p, radius, 0, TAU, 32, TEAL, 1.6, true)
		_diamond(p, radius * 0.6, TEAL, true)
		var label_y: float = p.y - radius - 8.0
		if label_y < float(box.top) + 16.0:
			label_y = p.y + radius + 19.0
		var name: String = str(part.get("id", "REPAIR PART")).replace("-", " ").to_upper()
		_cue_label("STEER INTO " + name, Vector2(p.x, label_y), TEAL, 10, PART_BACKING)
	if campaign.get("bossPhase", "") == "exit" and campaign.get("exit") is Dictionary:
		var y: float = chart_point(0, float(campaign.exit.get("remaining", 0))).y
		_paint.draw_line(Vector2(box.left, y), Vector2(box.right, y), TEAL, 2.0)
		_text("EXTRACT THE RECOVERED PART", Vector2(size.x * 0.5, y - 10), TEAL, 11)

func _draw_telegraphs() -> void:
	var cue_color: Color = ORANGE.lightened(0.30)
	for enemy in state.get("enemies", []):
		if float(enemy.get("hp", 0)) <= 0 or not in_combat_view(enemy) or not bool(enemy.get("presented", false)):
			continue
		var warning: Variant = enemy.get("telegraph")
		if not warning is Dictionary:
			continue
		var p: Vector2 = project(float(enemy.x), float(enemy.z))
		var remaining: float = float(warning.get("remaining", maxf(0, float(warning.get("until", state.get("time", 0))) - float(state.get("time", 0)))))
		var duration: float = maxf(0.001, float(warning.get("duration", 0.65)))
		var radius: float = maxf(10.0, 33.0 * float(_view_layout().scale))
		var end_angle: float = -PI / 2.0 + TAU * clampf(1.0 - remaining / duration, 0.01, 1.0)
		_paint.draw_arc(p, radius, -PI / 2.0, end_angle, 40, Color("071014"), 4.0, true)
		_paint.draw_arc(p, radius, -PI / 2.0, end_angle, 40, cue_color, 2.0, true)
		if bool(preferences.get("patternLabels", true)):
			var label_position := p + Vector2(0, radius + 17)
			if float(enemy.get("visibleFor", 0)) < ENTRY_TIME:
				label_position.y = p.y - radius - 17
				if label_position.y < float(_view_layout().top) + 12.0:
					label_position = p + Vector2((radius + 52.0) * (1.0 if p.x < size.x * 0.5 else -1.0), 0)
			_cue_label(str(warning.get("patternName", "PREPARING")), label_position, cue_color, 9)

func _draw_enemies() -> void:
	var box: Dictionary = _view_layout()
	for enemy in state.get("enemies", []):
		if float(enemy.get("hp", 0)) <= 0 or enemy.get("escaped", false) or int(enemy.get("stage", 0)) > int(state.get("stage", 0)) or not in_combat_view(enemy):
			continue
		if enemy.get("waveActive", true) == false or enemy.get("routeActive", true) == false:
			continue
		var p: Vector2 = project(float(enemy.x), float(enemy.z))
		var maximum: float = maxf(1.0, float(enemy.get("maxHp", enemy.get("hp", 1))))
		var kind: String = "klein" if is_surface() or chapter().get("klein", false) else "scout" if maximum <= 1.0 else "heavy" if int(enemy.get("id", 0)) % 2 else "gunner"
		if kind == "heavy" and float(enemy.hp) < maximum:
			kind += "-damaged"
		var base: String = "boss.core" if enemy.get("name", "") == "Core" else "boss.escort" if enemy.get("boss", false) else "enemy." + kind
		var facing: int = int(enemy.get("facing", -1)) * view_direction()
		var oriented: String = base + "-up" if facing == 1 else base
		if not manifest.get("frames", {}).has(oriented):
			oriented = base
		var width: float = (72.0 if enemy.get("name", "") == "Core" else 60.0 if enemy.get("boss", false) else 56.0) * float(box.scale)
		var ready: bool = bool(enemy.get("presented", false)) and float(enemy.get("visibleFor", 0.0)) >= ENTRY_TIME and float(enemy.get("wakeUntil", 0.0)) <= float(state.get("time", 0.0))
		var flash: float = clampf((float(enemy.get("hitUntil", 0)) - float(state.get("time", 0))) / 0.15, 0.0, 1.0) if motion_enabled() else 0.0
		_sprite(oriented, p, Vector2.ONE * width, Color(1.0 + flash * 1.8, 1.0 + flash * 1.8, 1.0 + flash * 1.8, 1.0 if ready else 0.48))
		var half: float = maxf(12.0, width * 0.52)
		var amount: float = float(enemy.hp) / maximum if ready else minf(1.0, float(enemy.get("visibleFor", 0)) / ENTRY_TIME)
		var meter := p + Vector2(0, width * 0.55 + 5)
		var label_position := meter + Vector2(0, 15)
		if not ready:
			var entry_text: String = "RETURN %s · %d HP" % [str(enemy.get("id", "")), ceili(float(enemy.hp))] if int(enemy.get("loopCount", 0)) else "ENTERING"
			if label_position.y + 4.0 > float(box.bottom):
				meter.y = maxf(float(box.top) + 15.0, p.y - width * 0.55 - 9.0)
				label_position.y = meter.y - 4.0
			var side_margin := maxf(half, _font.get_string_size(entry_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 9).x * 0.5) + 3.0
			meter.x = clampf(meter.x, float(box.left) + side_margin, float(box.right) - side_margin)
			label_position.x = meter.x
			_text(entry_text, label_position, BLUE, 9)
		elif enemy.get("training", false):
			_text("%d / %d" % [ceili(float(enemy.hp)), ceili(maximum)], p - Vector2(0, width * 0.55 + 8), IVORY, 10)
		elif enemy.get("boss", false):
			_text("%d / %d" % [ceili(float(enemy.hp)), ceili(maximum)], p + Vector2(0, width * 0.55 + 20), IVORY, 10)
		_paint.draw_rect(Rect2(meter - Vector2(half, 0), Vector2(half * 2, 4)), Color("101820"))
		_paint.draw_rect(Rect2(meter - Vector2(half, 0), Vector2(half * 2 * clampf(amount, 0, 1), 3)), BRASS if ready else BLUE)

func _draw_effects() -> void:
	var time: float = float(state.get("time", 0))
	var scale: float = float(_view_layout().scale)
	var part: Variant = state.get("campaign", {}).get("repairPart")
	var part_visible: bool = part is Dictionary and not bool(part.get("collected", false))
	var part_point: Vector2 = project(float(part.get("x", 0.0)), float(part.get("z", 0.0))) if part_visible else Vector2.ZERO
	for effect in state.get("effects", []):
		var started: float = float(effect.get("start", time))
		var until: float = float(effect.get("until", started + 0.2))
		if time < started or time > until:
			continue
		var age: float = clampf((time - started) / maxf(0.001, until - started), 0, 1)
		var point: Vector2 = project(float(effect.get("x", 0)), float(effect.get("z", 0)))
		var defeat: bool = effect.get("type", "") in ["defeat", "asteroid"]
		var color := Color(effect.get("color", "#e67f4e" if defeat else "#f0e4bd"))
		color.a = 1.0 - age
		if motion_enabled():
			_paint.draw_arc(point, (8 + age * (52 if defeat else 24)) * scale, 0, TAU, 32, color, 1.5 if defeat else 1.0, true)
			var animation: String = "asteroid.break" if effect.get("type", "") == "asteroid" else "effect.explosion" if defeat else "effect.hit"
			var frame: String = _animation_frame(animation, (time - started) * 1000.0)
			if not frame.is_empty():
				_sprite(frame, point, Vector2.ONE * (65 if defeat else 38) * scale, Color(1, 1, 1, 1.0 - age))
		else:
			_paint.draw_arc(point, 22 * scale, 0, TAU, 28, color, 1.3, true)
		if defeat and float(effect.get("points", 0)) > 0:
			var rise: float = age * 10.0 if motion_enabled() else 0.0
			var score_y: float = point.y - 25.0 * scale - rise
			if part_visible and point.distance_to(part_point) <= maxf(18.0, 30.0 * scale):
				score_y = part_point.y + maxf(46.0, 20.0 * scale + 36.0) + rise
			_text("+%s" % str(effect.points), Vector2(point.x, score_y), IVORY, 12)
	if not motion_enabled():
		return
	for event in visual_events:
		var age: float = time - float(event.get("time", time))
		if age < 0 or age > 0.45:
			continue
		var type: String = str(event.get("type", ""))
		var animation: String = "effect.muzzle" if type in ["player-fire", "enemy-fire"] else "effect.hit" if type == "damage" else "effect.absorb" if type in ["impact-absorbed", "contact-absorbed"] else "effect.warp" if type == "operation" and int(event.get("typeId", -1)) == 0 else ""
		if animation.is_empty():
			continue
		var frame: String = _animation_frame(animation, age * 1000)
		if not frame.is_empty():
			var point: Vector2 = project(float(event.get("x", state.get("x", 0))), float(event.get("z", state.get("z", 0))))
			_sprite(frame, point, Vector2.ONE * (22 if animation == "effect.muzzle" else 44) * scale)

func _draw_shots() -> void:
	var box: Dictionary = _view_layout()
	var scale: float = float(box.scale)
	if scale != _round_shot_scale:
		_round_shot_scale = scale
		_round_shot_textures.clear()
	var arena := Rect2(Vector2(box.left, box.top), Vector2(box.width, box.height))
	var targets: Array = Ecology.capture_targets(state) if state.get("phase") == "running" and float(state.get("countdown", 0)) <= 0 else []
	var guidance: Dictionary = state.get("campaign", {}).get("training", {})
	var focus_shot: String = str(guidance.get("promptShot", "")) if guidance.get("prompt", "") in ["dodge-left", "dodge-right", "unfold", "finish"] else ""
	for owner in ["shots", "enemyShots"]:
		var hostile: bool = owner == "enemyShots"
		for shot in state.get(owner, []):
			if shot.get("dead", false):
				continue
			var p: Vector2 = project(float(shot.get("x", 0)), float(shot.get("z", 0)))
			if p.y < float(box.top) - 20 or p.y > float(box.bottom) + 20:
				continue
			var marks: Dictionary = projectile_marks(shot)
			var depth: int = int(marks.depth)
			var rule: String = str(marks.rule)
			var color: Color = ORANGE if hostile else IVORY
			var direction: Vector2 = projectile_direction(shot, hostile)
			_draw_shot_marks(shot, marks, p, direction, scale)
			if motion_enabled() and float(shot.get("hold", 0)) <= 0:
				var gain: float = 1.0 / maxf(0.001, Space.metric_at(float(shot.get("z", 0)), state.get("fields", [])))
				_paint.draw_line(p - direction * (15.0 if hostile else 23.0) * scale * (1.0 + minf(3.0, gain - 1.0) * 0.55), p, Color(color, 0.38), 1.5)
			if hostile:
				var radius: float = maxf(2.8, (8.0 if float(shot.get("damage", 1)) > 1 else 5.0) * scale)
				if not targets.is_empty() and arena.has_point(p) and targets.any(func(target): return is_same(target, shot)):
					_draw_capture_target(p, radius)
				if rule == "projective":
					var extent := Vector2.ONE * radius
					_paint.draw_texture_rect(_projective_shot_texture, Rect2(p - extent, extent * 2.0), false, color)
				else:
					_draw_round_hostile_shot(p, radius)
				if not focus_shot.is_empty() and shot.get("objectId", "") == focus_shot and arena.has_point(p):
					_draw_guided_shot(p, radius + 5.0)
				if float(shot.get("damage", 1)) > 1:
					_text("×%s" % str(shot.damage), p + Vector2(radius + 8, 3), ORANGE, 9)
			else:
				var dimensions := Vector2(maxf(3.0, 7.0 * scale), 18.0 * scale)
				if direction == Vector2.UP:
					_sprite("shot.player", p, dimensions)
				else:
					_paint.draw_set_transform(p, direction.angle() + PI / 2.0, Vector2.ONE)
					_sprite("shot.player", Vector2.ZERO, dimensions)
					_paint.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

func _make_projective_shot_texture() -> Texture2D:
	const SIZE: int = 64
	var image := Image.create_empty(SIZE, SIZE, false, Image.FORMAT_RGBA8)
	for row in range(SIZE):
		for column in range(SIZE):
			if absf(row + 0.5 - SIZE * 0.5) + absf(column + 0.5 - SIZE * 0.5) <= SIZE * 0.5:
				image.set_pixel(column, row, Color.WHITE)
	return ImageTexture.create_from_image(image)

func _draw_round_hostile_shot(point: Vector2, radius: float) -> void:
	var image_texture: Texture2D = _round_shot_textures.get(radius)
	if image_texture == null:
		image_texture = _make_round_shot_texture(radius)
		_round_shot_textures[radius] = image_texture
	var dimensions: Vector2 = image_texture.get_size() / ROUND_SHOT_SAMPLES
	_paint.draw_texture_rect(image_texture, Rect2(point - dimensions * 0.5, dimensions), false)

func _make_round_shot_texture(radius: float) -> Texture2D:
	var half_extent: int = ceili((radius + 1.0) * ROUND_SHOT_SAMPLES)
	var extent: int = half_extent * 2
	var rgba := PackedByteArray()
	rgba.resize(extent * extent * 4)
	var inner_radius: float = maxf(0.0, radius * cos(ROUND_SHOT_RING_STEP * 0.5) - 1.0)
	var body_color: int = ORANGE.to_abgr32()
	for row in range(extent):
		var y: float = (float(row - half_extent) + 0.5) / ROUND_SHOT_SAMPLES
		for column in range(extent):
			var x: float = (float(column - half_extent) + 0.5) / ROUND_SHOT_SAMPLES
			var distance: float = sqrt(x * x + y * y)
			var offset: int = (row * extent + column) * 4
			if distance < inner_radius:
				rgba.encode_u32(offset, body_color)
			elif distance <= radius + 1.0:
				var angle: float = fposmod(atan2(y, x), ROUND_SHOT_RING_STEP) - ROUND_SHOT_RING_STEP * 0.5
				var edge_distance: float = absf(distance * cos(angle) - radius * cos(ROUND_SHOT_RING_STEP * 0.5))
				var outline_alpha: float = 1.0 - clampf((edge_distance - 0.175) / 0.5, 0.0, 1.0)
				var fill: Color = ORANGE if distance <= radius else Color.TRANSPARENT
				rgba.encode_u32(offset, fill.blend(Color(IVORY, outline_alpha)).to_abgr32())
	var image: Image = Image.create_from_data(extent, extent, false, Image.FORMAT_RGBA8, rgba)
	return ImageTexture.create_from_image(image)

func _draw_guided_shot(point: Vector2, offset: float) -> void:
	for side: float in [-1.0, 1.0]:
		var edge := point + Vector2(side * offset, 0.0)
		var bracket := PackedVector2Array([edge + Vector2(-side * 3, -5), edge + Vector2(0, -5),
			edge + Vector2(0, 5), edge + Vector2(-side * 3, 5)])
		_paint.draw_polyline(bracket, PART_BACKING, 3.5, true)
		_paint.draw_polyline(bracket, IVORY, 1.3, true)

func _draw_capture_target(point: Vector2, core_radius: float) -> void:
	var offset: float = core_radius + 5.0
	for side: float in [-1.0, 1.0]:
		var tip := point + Vector2(side * offset, 0)
		var ends := PackedVector2Array([tip + Vector2(side * 4, -4), tip, tip + Vector2(side * 4, 4)])
		_paint.draw_polyline(ends, PART_BACKING, 3.5, true)
		_paint.draw_polyline(ends, RESOURCE, 1.7, true)

func projectile_marks(shot: Dictionary) -> Dictionary:
	return {"depth": Space.fold_depth_at(float(shot.get("z", 0)), state.get("fields", [])),
		"held": float(shot.get("hold", 0)) > 0,
		"parity": int(shot.get("transportParity", 0)) % 2,
		"rule": _projectile_rule(shot),
		"crossed": int(shot.get("surfaceCrossings", 0)) > 0}

func projectile_direction(shot: Dictionary, hostile: bool = false) -> Vector2:
	var frame: int = 1 if is_surface() else view_direction()
	var direction := Vector2(float(shot.get("vx", 0)), -float(shot.get("vz", -145 if hostile else 680)) * frame).normalized()
	return direction if direction != Vector2.ZERO else Vector2.DOWN if hostile else Vector2.UP

func _draw_shot_marks(shot: Dictionary, marks: Dictionary, p: Vector2, direction: Vector2, scale: float) -> void:
	var size_px: float = maxf(2.0, 3.0 * scale)
	for index in range(int(marks.depth)):
		var pip: Vector2 = p - direction * (maxf(8, 12 * scale) + index * maxf(5, 7 * scale))
		_paint.draw_rect(Rect2(pip - Vector2.ONE * size_px * 0.5, Vector2.ONE * size_px), BRASS)
	if is_boss() or is_surface():
		var side: Vector2 = Vector2(-direction.y, direction.x) * (-1 if int(marks.parity) else 1)
		var marker: Vector2 = p + side * maxf(7, 12 * scale)
		_paint.draw_rect(Rect2(marker - Vector2.ONE * size_px * 0.5, Vector2.ONE * size_px), VIOLET if str(marks.rule) == "projective" else IVORY)
	if bool(marks.held):
		var radius: float = maxf(8, 15 * scale)
		for sx in [-1, 1]:
			for sy in [-1, 1]:
				var corner: Vector2 = p + Vector2(sx, sy) * radius
				_paint.draw_line(corner, corner - Vector2(sx, 0) * 4, BLUE, 1.3)
				_paint.draw_line(corner, corner - Vector2(0, sy) * 4, BLUE, 1.3)
	var age: float = float(state.get("time", 0)) - float(shot.get("lastCrossingAt", -100))
	if bool(marks.crossed) and age >= 0 and age < 0.42 and bool(preferences.get("manifoldCues", true)):
		var radius: float = maxf(10, 18 * scale)
		var color: Color = VIOLET if str(shot.get("lastCrossing", {}).get("rule", "")) == "projective" else BRASS
		_paint.draw_line(p + Vector2(-radius, -4), p + Vector2(-radius, 4), color, 1.5)
		_paint.draw_line(p + Vector2(radius, -4), p + Vector2(radius, 4), color, 1.5)

func terminal_marks() -> Array:
	var now: float = float(state.get("time", 0))
	var events: Array = state.get("events", [])
	var result: Array = []
	for index in range(events.size() - 1, -1, -1):
		var event: Dictionary = events[index]
		var age: float = now - float(event.get("time", now))
		if age > 0.6:
			break
		if age < 0 or event.get("type", "") != "projectile-ended":
			continue
		var cause: String = str(event.get("cause", ""))
		if not cause in ["journey-complete", "capture", "ward", "phase-clear", "recovery-clear"]:
			continue
		result.append(event)
		if result.size() >= 32:
			break
	return result

func _draw_terminal_marks() -> void:
	var now: float = float(state.get("time", 0))
	for event in terminal_marks():
		var age: float = now - float(event.get("time", now))
		var p: Vector2 = project(float(event.get("x", 0)), float(event.get("z", 0)))
		var cause: String = str(event.get("cause", ""))
		var alpha: float = 1.0 - age / 0.6 if motion_enabled() else 0.85
		if cause == "journey-complete":
			for offset in [Vector2(-5, -3), Vector2(4, 0), Vector2(0, 5)]:
				_paint.draw_rect(Rect2(p + offset, Vector2.ONE * 2), Color(MUTED, alpha * 0.7))
		elif cause == "capture":
			_diamond(p, 8, Color(RESOURCE, alpha), false)
			_paint.draw_line(p + Vector2(-3, 0), p + Vector2(3, 0), Color(RESOURCE, alpha), 1.4)
		elif cause == "ward":
			_paint.draw_line(p + Vector2(-7, -4), p + Vector2(0, 4), Color(RESOURCE, alpha), 1.4)
			_paint.draw_line(p + Vector2(0, 4), p + Vector2(7, -4), Color(RESOURCE, alpha), 1.4)
		elif cause in ["phase-clear", "recovery-clear"]:
			_paint.draw_line(p + Vector2(-6, -3), p + Vector2(-2, 3), Color(VIOLET, alpha * 0.6), 1.0)
			_paint.draw_line(p + Vector2(2, -3), p + Vector2(6, 3), Color(VIOLET, alpha * 0.6), 1.0)

func _draw_crossing_notice() -> void:
	var box: Dictionary = _view_layout()
	var events: Array = state.get("events", [])
	var now: float = float(state.get("time", 0))
	for index in range(events.size() - 1, -1, -1):
		var event: Dictionary = events[index]
		if now - float(event.get("time", now)) >= 1.15:
			break
		if event.get("type", "") == "klein-crossing" and event.get("actor", "") == "player":
			var label: String = "MIRROR JOIN · LATERAL DIRECTION REVERSED" if event.get("rule", "") == "projective" else "SIDE JOIN · FORWARD DIRECTION REVERSED" if event.get("edge", "") in ["left", "right"] else "END JOIN · DIRECTION PRESERVED"
			_wrapped_cue(label, Vector2(size.x * 0.5, float(box.bottom) - 46), float(box.width) - 20, VIOLET if event.get("rule", "") == "projective" else TEAL, 9)
			break

func _projectile_rule(shot: Dictionary) -> String:
	if not (is_boss() or is_surface()):
		return "periodic"
	if chapter().get("projectiveSurface", false) or chapter().get("projectiveBoss", false):
		return "projective"
	if chapter().get("hybrid", false):
		if Campaign.hybrid_active(state):
			return "projective" if shot.get("geometryRule", "") == "projective" else "hybrid"
		if int(state.get("campaign", {}).get("hybridPhase", 1)) == 2 and shot.get("projective", false):
			return "projective"
	return "klein"

func _frame_marker() -> String:
	if not (is_boss() or is_surface()):
		return "OPEN"
	if chapter().get("hybrid", false):
		if Campaign.hybrid_active(state):
			return "K+P"
		return "K/P" if int(state.get("campaign", {}).get("hybridPhase", 1)) == 2 else "K"
	return "P" if chapter().get("projectiveSurface", false) or chapter().get("projectiveBoss", false) else "K"

func _cue_label(value: String, position: Vector2, color: Color, font_size: int, backing: Color = Color(0.02, 0.04, 0.05, 0.9)) -> void:
	var box: Dictionary = _view_layout()
	var width: float = minf(float(box.width) - 12, _font.get_string_size(value, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x + 10)
	var center: Vector2 = position
	center.x = clampf(center.x, float(box.left) + width * 0.5 + 4, float(box.right) - width * 0.5 - 4)
	center.y = clampf(center.y, float(box.top) + font_size + 6, float(box.bottom) - 6)
	_paint.draw_rect(Rect2(center - Vector2(width * 0.5, font_size + 3), Vector2(width, font_size + 7)), backing)
	_text(value, center, color, font_size)

func _wrapped_cue(value: String, center: Vector2, width: float, color: Color, font_size: int) -> void:
	var lines: Array[String] = []
	var line: String = ""
	for word in value.split(" "):
		var next: String = word if line.is_empty() else line + " " + word
		if not line.is_empty() and _font.get_string_size(next, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x > width:
			lines.append(line)
			line = word
		else:
			line = next
	if not line.is_empty():
		lines.append(line)
	for i in range(lines.size()):
		_cue_label(lines[i], center + Vector2(0, i * (font_size + 4)), color, font_size)

func _draw_player() -> void:
	var ship: Dictionary = active_ship()
	var p: Vector2 = project(float(state.get("x", 0)), float(state.get("z", 0)))
	var scale: float = float(_view_layout().scale)
	var facing: int = int(state.get("facing", 1)) * view_direction()
	var time: float = float(state.get("time", 0))
	var recoil: float = 0.0
	if motion_enabled() and time - last_fire >= 0 and time - last_fire < 0.25:
		recoil = sin((time - last_fire) * 28.0) * exp(-(time - last_fire) * 18.0) * 2.8 * scale
	_paint.draw_set_transform(p + Vector2(0, recoil * facing), bank, Vector2.ONE)
	if motion_enabled():
		var engine: Dictionary = ship.get("exhaust", {})
		var length: float = float(engine.get("length", 24.0)) * engine_gain * scale * (1.0 + sin(time * 43.0) * 0.045)
		for nozzle in engine.get("nozzles", [{"x": 0, "y": 13}]):
			var point := Vector2(float(nozzle.x) * facing, float(nozzle.y) * facing) * 56.0 / float(engine.get("nativeSize", 32.0)) * scale
			var width: float = float(engine.get("width", 14.0)) * 0.28 * scale
			var frame: String = _animation_frame("engine.player-down" if facing == 1 else "engine.player-up", time * 1000)
			if not frame.is_empty():
				_sprite(frame, point + Vector2(0, length * 0.5 * facing), Vector2(float(engine.get("width", 14.0)) * scale, length))
			else:
				_paint.draw_colored_polygon(PackedVector2Array([point + Vector2(-width, 0), point + Vector2(0, length * facing), point + Vector2(width, 0)]), Color(TEAL, 0.65))
				_paint.draw_line(point, point + Vector2(0, length * 0.65 * facing), IVORY, maxf(0.8, 1.5 * scale))
	var id: String = str(ship.get("sprite", "player.arrow")) + ("-down" if facing == -1 else "")
	_sprite(id, Vector2.ZERO, Vector2.ONE * 56.0 * scale, Color(1, 1, 1, 0.76 if float(state.get("invulnerable", 0)) > 0 else 1.0))
	_paint.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	if bool(preferences.get("showCore", true)) or float(state.get("invulnerable", 0)) > 0:
		_paint.draw_arc(p, float(ship.get("coreRadius", 18)) * scale, 0, TAU, 40, BLUE if float(state.get("invulnerable", 0)) > 0 else Color(IVORY, 0.78), 1.1, true)
		_paint.draw_line(p - Vector2(5 * scale, 0), p + Vector2(5 * scale, 0), Color(IVORY, 0.6), 0.8)
		_paint.draw_line(p - Vector2(0, 5 * scale), p + Vector2(0, 5 * scale), Color(IVORY, 0.6), 0.8)
	_paint.draw_circle(p, maxf(1.5, 2.5 * scale), IVORY)
	if time - last_hit >= 0 and time - last_hit < 0.5:
		var age: float = time - last_hit
		_paint.draw_arc(p, (24.0 + age * 75.0 if motion_enabled() else 30.0) * scale, 0, TAU, 48, Color(ORANGE, 1.0 - age / 0.5), 1.8, true)
	if steering_draw_probe.is_valid():
		var report := steering_draw_probe
		steering_draw_probe = Callable()
		report.call()

func _draw_debts() -> void:
	var groups: Dictionary = {}
	for debt in state.get("debts", []):
		var key: String = str(debt.get("target", "player"))
		if not groups.has(key):
			groups[key] = {"amount": 0.0, "due": float(debt.get("due", 0))}
		groups[key].amount += float(debt.get("amount", 1))
		groups[key].due = minf(float(groups[key].due), float(debt.get("due", 0)))
	for key in groups:
		var debt: Dictionary = groups[key]
		var actor: Dictionary = state
		if key != "player":
			actor = {}
			for enemy in state.get("enemies", []):
				if str(enemy.get("id")) == key:
					actor = enemy
					break
		if actor.is_empty() or not in_combat_view(actor):
			continue
		var p: Vector2 = project(float(actor.get("x", 0)), float(actor.get("z", 0)))
		var radius: float = 29.0 * float(_view_layout().scale)
		_paint.draw_arc(p, radius, 0.15, PI - 0.15, 20, ORANGE, 1.4, true)
		_paint.draw_arc(p, radius, PI + 0.15, TAU - 0.15, 20, ORANGE, 1.4, true)
		_text("DAMAGE DUE %s · %.1f s" % [str(debt.get("amount", 1)), maxf(0, float(debt.get("due", 0)) - float(state.get("time", 0)))], p + Vector2(0, radius + 14), ORANGE, 9)

func _sprite(id: String, center: Vector2, dimensions: Vector2, tint: Color = Color.WHITE) -> void:
	var frames: Dictionary = manifest.get("frames", {})
	if atlas and frames.has(id):
		var frame: Dictionary = frames[id]
		_paint.draw_texture_rect_region(atlas, Rect2(center - dimensions * 0.5, dimensions), Rect2(float(frame.x), float(frame.y), float(frame.width), float(frame.height)), tint, false, true)

func _animation_frame(id: String, time_ms: float) -> String:
	var animation: Dictionary = manifest.get("animations", {}).get(id, {})
	if animation.is_empty() or not is_finite(time_ms):
		return ""
	var duration: float = 0.0
	for interval in animation.get("durationsMs", []):
		duration += float(interval)
	if duration <= 0:
		return ""
	time_ms = maxf(0, time_ms)
	if bool(animation.get("loop", false)):
		time_ms = fposmod(time_ms, duration)
	elif time_ms >= duration:
		return ""
	for i in range(animation.get("frames", []).size()):
		time_ms -= float(animation.durationsMs[i])
		if time_ms < 0:
			return str(animation.frames[i])
	return ""

func _diamond(center: Vector2, radius: float, color: Color, filled: bool) -> void:
	var points := PackedVector2Array([center + Vector2(0, -radius), center + Vector2(radius, 0), center + Vector2(0, radius), center + Vector2(-radius, 0)])
	if filled:
		_paint.draw_colored_polygon(points, color)
	else:
		points.append(points[0])
		_paint.draw_polyline(points, color, 1.3, true)

func _text(value: String, position: Vector2, color: Color, font_size: int = 10, centered: bool = true) -> void:
	var origin: Vector2 = position
	if centered:
		origin.x -= _font.get_string_size(value, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x * 0.5
	_paint.draw_string(_font, origin, value, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, color)
