extends RefCounted

var state: int = 0

static func imul(a: int, b: int) -> int:
	var low = (a & 65535) * (b & 65535)
	var middle = (((a >> 16) & 65535) * (b & 65535) + (a & 65535) * ((b >> 16) & 65535)) & 65535
	return (low + (middle << 16)) & 0xffffffff

func _init(seed_value: int = 0, section: int = 0) -> void:
	state = (seed_value ^ imul(section + 1, 0x9e3779b9)) & 0xffffffff

func next_float() -> float:
	state = (state + 0x6d2b79f5) & 0xffffffff
	var value = imul(state ^ (state >> 15), state | 1)
	value = (value ^ ((value + imul(value ^ (value >> 7), value | 61)) & 0xffffffff)) & 0xffffffff
	return float((value ^ (value >> 14)) & 0xffffffff) / 4294967296.0
