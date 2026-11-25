extends VBoxContainer

const Space = preload("res://scripts/space_core.gd")
const DURATION := 0.10
const REPLAY_TIME := 0.85
const START_INSIDE := 300.0
const START_OUTSIDE := 25.0
const ENEMY_START := 540.0
const SHOT_SPEED := [680.0, -145.0]
const SHOT_COLOR := [Color("8bdfdf"), Color("ffae87")]
const TEXT_COLOR := Color("d5dfe0")
const GUIDE_COLOR := Color("f0e4bd")

var reduced_motion := false
var fields: Array
var outside := false
var elapsed := 0.0
var travel_scale: float
var diagram: Control
var positions: Label
var result: Label

func _ready() -> void:
	name = "FoldExample"
	add_theme_constant_override("separation", 7)
	var flight := {"mode": "campaign", "campaign": {"index": -1, "lesson": "engage"},
		"chapter": {"kind": "tutorial"}, "fields": [], "z": 0.0, "facing": 1}
	Space.add_fold(flight)
	fields = flight.fields
	travel_scale = distance(START_INSIDE, SHOT_SPEED[0], DURATION, fields)
	_label("Fold example", GUIDE_COLOR)
	var controls := HBoxContainer.new()
	add_child(controls)
	_button(controls, "Compare travel", _run_example)
	_button(controls, "Move your shot", _move_shot)
	positions = _label("")
	diagram = Control.new()
	diagram.mouse_filter = Control.MOUSE_FILTER_IGNORE
	diagram.custom_minimum_size.y = 131
	diagram.draw.connect(_draw_diagram)
	add_child(diagram)
	result = _label("", GUIDE_COLOR)
	_reset_example()

static func distance(start: float, speed: float, time: float, active_fields: Array) -> float:
	var finish := Space.advance_projectile(start, speed * time, active_fields)
	return absf(Space.space_distance(start, finish, active_fields))

func _label(value: String, color: Color = TEXT_COLOR) -> Label:
	var label := Label.new()
	label.text = value
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", 15)
	label.add_theme_color_override("font_color", color)
	add_child(label)
	return label

func _button(parent: Control, value: String, action: Callable) -> void:
	var button := Button.new()
	button.text = value
	button.custom_minimum_size.y = 34
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.pressed.connect(action)
	parent.add_child(button)

func _move_shot() -> void:
	outside = not outside
	_reset_example()

func _reset_example() -> void:
	elapsed = 0.0
	set_process(false)
	positions.text = "Your shot starts before the fold. The enemy shot starts in the fold." if outside else "Both shots start in the fold."
	result.text = "Which shot will move a longer distance than in open space?" if outside else "Compare the distance each shot moves in the same time."
	diagram.queue_redraw()

func _run_example() -> void:
	if reduced_motion:
		elapsed = REPLAY_TIME
		_finish_example()
		diagram.queue_redraw()
		return
	elapsed = 0.0
	set_process(true)
	result.text = "Both tests use the same time."
	diagram.queue_redraw()

func _process(delta: float) -> void:
	elapsed = minf(REPLAY_TIME, elapsed + delta)
	diagram.queue_redraw()
	if elapsed >= REPLAY_TIME:
		_finish_example()

func _finish_example() -> void:
	set_process(false)
	if outside:
		result.text = "Only the enemy shot moves a longer distance. Your shot stays outside the fold."
	else:
		result.text = "Both shots move a longer distance in the fold. Your shot can hit the target in less time. Remove the fold for more time to steer away from the enemy shot."

func _draw_diagram() -> void:
	var width := diagram.size.x
	var font := get_theme_default_font()
	var your_start := START_OUTSIDE if outside else START_INSIDE
	var origin := 9.0
	var map_scale := (width - 2.0 * origin) / float(fields[0].end)
	var edge := origin + float(fields[0].start) * map_scale
	diagram.draw_rect(Rect2(Vector2(edge, 0), Vector2(width - origin - edge, 25)), Color("18363e"))
	diagram.draw_line(Vector2(edge, 0), Vector2(edge, 25), Color("71a6ad"), 1)
	diagram.draw_string(font, Vector2(width - 45.0, 17), "Fold", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, TEXT_COLOR)
	_draw_marker(Vector2(origin + your_start * map_scale, 12), 0)
	_draw_marker(Vector2(origin + ENEMY_START * map_scale, 12), 1)
	var time := DURATION * elapsed / REPLAY_TIME
	var track_start := 83.0
	var path_scale := (width - track_start - 10.0) / travel_scale
	for shot in range(2):
		var start: float = your_start if shot == 0 else ENEMY_START
		var y := 43.0 + float(shot) * 50.0
		_draw_marker(Vector2(6, y - 4), shot)
		diagram.draw_string(font, Vector2(17, y), ["Your shot", "Enemy shot"][shot], HORIZONTAL_ALIGNMENT_LEFT, -1, 13, TEXT_COLOR)
		for row in range(2):
			var row_y := y + 12.0 + float(row) * 15.0
			var run_fields: Array = fields if row == 1 else []
			var travel := distance(start, SHOT_SPEED[shot], time, run_fields)
			diagram.draw_string(font, Vector2(22, row_y + 4), ["Open", "Folded"][row], HORIZONTAL_ALIGNMENT_LEFT, -1, 12, TEXT_COLOR)
			diagram.draw_line(Vector2(track_start, row_y), Vector2(width - 10.0, row_y), Color("2c444c"), 1)
			var finish := Vector2(track_start + travel * path_scale, row_y)
			diagram.draw_line(Vector2(track_start, row_y), finish, SHOT_COLOR[shot], 3)
			_draw_marker(finish, shot)

func _draw_marker(position: Vector2, shot: int) -> void:
	if shot == 0:
		diagram.draw_circle(position, 3.5, SHOT_COLOR[shot], true, -1.0, true)
	else:
		diagram.draw_colored_polygon(PackedVector2Array([
			position + Vector2(0, -4), position + Vector2(4, 0),
			position + Vector2(0, 4), position + Vector2(-4, 0)]), SHOT_COLOR[shot])
