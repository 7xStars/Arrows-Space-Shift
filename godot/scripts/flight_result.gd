extends VBoxContainer

const GOLD := Color("edce87")
const IVORY := Color("f7ebc7")
const MUTED := Color("a6b5b9")
const TRACK := Color("4a4b42")

class RecordTrack extends Control:
	var chart_progress: float = 0.0
	var reveal: float = 1.0:
		set(value):
			reveal = value
			queue_redraw()

	func _draw() -> void:
		var left := 6.0
		var width := maxf(1.0, size.x - 12.0)
		var y := size.y * 0.5
		var end: float = width * chart_progress * reveal
		draw_line(Vector2(left, y), Vector2(left + width, y), TRACK, 1)
		if end > 0:
			draw_line(Vector2(left, y), Vector2(left + end, y), GOLD, 2)
		for index in range(4):
			var point := Vector2(left + width * index / 3.0, y)
			var color := GOLD if point.x <= left + end + 0.5 else TRACK
			var diamond := PackedVector2Array([point + Vector2(0, -4), point + Vector2(4, 0), point + Vector2(0, 4), point + Vector2(-4, 0), point + Vector2(0, -4)])
			draw_polyline(diamond, color, 1.2, true)
		if reveal < 1.0:
			draw_arc(Vector2(left + end, y), 4.0 + reveal * 5.0, 0, TAU, 24, Color(GOLD, 1.0 - reveal), 1.25, true)

var score_reading: Label
var rank_reading: Label
var track: RecordTrack
var reveal_tween: Tween

func _ready() -> void:
	add_theme_constant_override("separation", 0)
	_reading(11, GOLD).text = "FLIGHT SCORE"
	score_reading = _reading(41, IVORY)
	score_reading.text = "0"
	track = RecordTrack.new()
	track.custom_minimum_size.y = 17
	track.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(track)
	rank_reading = _reading(13, MUTED)
	track.accessibility_name = "Campaign progress at end of flight"

func _reading(font_size: int, color: Color) -> Label:
	var reading := Label.new()
	reading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	reading.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	reading.add_theme_font_size_override("font_size", font_size)
	reading.add_theme_color_override("font_color", color)
	add_child(reading)
	return reading

func show_score(outcome: Dictionary, rank_text: String, animate: bool) -> void:
	score_reading.text = str(outcome.score)
	score_reading.accessibility_name = "Flight score %d" % int(outcome.score)
	rank_reading.text = rank_text
	track.chart_progress = 1.0 if outcome.complete else (float(outcome.chapter) + 1.0) / 28.0
	if reveal_tween != null:
		reveal_tween.kill()
	track.reveal = 0.0 if animate else 1.0
	if animate:
		reveal_tween = create_tween().set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		reveal_tween.tween_property(track, "reveal", 1.0, 0.54)
