extends RefCounted

static var _data: Dictionary = {}

static func get_data() -> Dictionary:
	if _data.is_empty():
		var parsed = JSON.parse_string(FileAccess.get_file_as_string("res://data/game.json"))
		if parsed is Dictionary:
			_data = parsed
		else:
			push_error("The game definitions could not load.")
	return _data
