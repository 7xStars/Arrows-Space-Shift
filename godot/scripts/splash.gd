extends Control

signal finished

var reduced_motion: bool = false
var elapsed: float = 0.0
var leaving: bool = false
var art: Texture2D
var hint: Label

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	art = load("res://assets/branding/splash.svg")
	hint = Label.new()
	hint.text = "Press Enter or click to continue"
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.add_theme_color_override("font_color", Color("879da4"))
	hint.add_theme_font_size_override("font_size", 14)
	add_child(hint)
	resized.connect(_place_hint)
	_place_hint()
	queue_redraw()

func _place_hint() -> void:
	if hint:
		hint.position = Vector2(12.0, size.y - 64.0)
		hint.size = Vector2(maxf(1.0, size.x - 24.0), 30.0)
	queue_redraw()

func _process(delta: float) -> void:
	elapsed += delta
	if reduced_motion:
		modulate.a = 1.0
	else:
		modulate.a = minf(1.0, elapsed / 0.22)
	if elapsed >= 1.65:
		finish()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		accept_event()
		finish()
	elif event is InputEventScreenTouch and event.pressed:
		accept_event()
		finish()

func finish() -> void:
	if leaving:
		return
	leaving = true
	finished.emit()
	queue_free()

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color("05090d"))
	if art:
		var width: float = minf(size.x - 36.0, 1040.0)
		var height: float = width * 675.0 / 1200.0
		if height > size.y - 92.0:
			height = maxf(1.0, size.y - 92.0)
			width = height * 1200.0 / 675.0
		draw_texture_rect(art, Rect2((size - Vector2(width, height)) * 0.5 - Vector2(0, 12), Vector2(width, height)), false)
