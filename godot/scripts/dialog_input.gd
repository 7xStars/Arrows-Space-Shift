extends Control

signal cancelled

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		var key: int = event.physical_keycode if event.physical_keycode else event.keycode
		if key == KEY_ESCAPE:
			get_viewport().set_input_as_handled()
			cancelled.emit()
