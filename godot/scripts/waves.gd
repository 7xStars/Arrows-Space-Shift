extends RefCounted
const Data = preload("res://scripts/game_data.gd")

static func script_for(chapter: Dictionary):
	var key = chapter.get("waveScript", "")
	if key == "":
		return null
	var data = Data.get_data()
	return data.get("actTwoWaveScripts", {}).get(key, data.get("actThreeWaveScripts", {}).get(key, null))

static func compile_script(chapter: Dictionary, random) :
	var script = script_for(chapter)
	if script == null:
		return null
	var enemies: Array = []
	var waves: Array = []
	for source in script.waves:
		var plan = {"id":source.id,"at":source.at,"label":source.label,"kind":source.get("kind","combat"),"clearHostile":source.get("clearHostile",false),"enemyIds":[]}
		for index in range(source.members.size()):
			var member = source.members[index]
			var jitter = 0.0 if member.get("jitter",1) == 0 else (random.next_float()-.5)*(8 if abs(member.lane)>300 else 18)
			var spec = member.duplicate(true)
			spec.merge({"waveId":source.id,"waveLabel":source.label,"waveKind":source.get("kind","combat"),"progress":clampf(source.at+member.get("progressOffset",index*.004),0,.98),"activationAt":maxf(0,source.at-.19),"lane":clampf(member.lane+jitter,-330,330),"attackDelay":member.get("attackDelay",index*.18)},true)
			enemies.append(spec)
			plan.enemyIds.append(enemies.size()-1)
		waves.append(plan)
	return {"script":script,"enemies":enemies,"waves":waves,"notices":script.get("notices",[]),"scriptedFolds":script.get("scriptedFolds",[])}
