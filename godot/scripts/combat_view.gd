extends RefCounted
const Space=preload("res://scripts/space_core.gd")
const Edge=preload("res://scripts/edge_core.gd")
static func is_boss(s: Dictionary) -> bool:return s.get("chapter",{}).get("kind","")=="boss"
static func is_surface(s: Dictionary) -> bool:return s.get("chapter",{}).get("kind","")=="level" and s.chapter.get("kleinSurface",false)
static func direction(s: Dictionary) -> int:return int(s.get("facing",1)) if is_boss(s) or is_surface(s) else 1
static func view_y(s: Dictionary,z: float) -> float:
	var origin=s.z if is_boss(s) else s.get("surfaceViewZ",0) if is_surface(s) else s.get("cameraZ",0)
	var y=direction(s)*Space.space_distance(origin,z,s.fields)
	return Edge.klein_y(y) if is_boss(s) else y
static func in_view(s: Dictionary,obj: Dictionary,padding: float=28) -> bool:
	var y=view_y(s,obj.z)
	return obj.x>=-400+padding and obj.x<=400-padding and y>=-70+padding and y<=950-padding
static func in_shot_view(s: Dictionary,obj: Dictionary) -> bool:return in_view(s,obj,0)
static func can_prepare(s: Dictionary,enemy: Dictionary) -> bool:
	return enemy.get("presented",false) and enemy.get("wakeUntil",0)<=s.time and in_view(s,enemy)
static func ready(s: Dictionary,enemy: Dictionary) -> bool:
	return enemy.get("visibleFor",0)>=.65 and can_prepare(s,enemy)
static func update_readiness(s: Dictionary,dt: float) -> void:
	for enemy in s.enemies:
		var y=view_y(s,enemy.z);var crossed=is_boss(s) and enemy.has("lastViewY") and abs(y-enemy.lastViewY)>510
		if not in_view(s,enemy) or enemy.stage>s.stage or crossed:
			enemy.presented=false;enemy.visibleFor=0
			if is_boss(s):enemy.telegraph=null;enemy.contacting=false
		elif enemy.get("presented",false):enemy.visibleFor=enemy.get("visibleFor",0)+dt
		if is_boss(s):enemy.lastViewY=y
