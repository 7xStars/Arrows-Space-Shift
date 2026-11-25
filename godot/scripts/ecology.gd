extends RefCounted
const Data=preload("res://scripts/game_data.gd")
const Space=preload("res://scripts/space_core.gd")
const Random=preload("res://scripts/random.gd")
const Journey=preload("res://scripts/projectile_journey.gd")

static func safe_count(value,max_value: int) -> int:
	return int(value) if (value is int or value is float) and value==floor(value) and value>=0 and value<=max_value else 0
static func create_state(value: Dictionary={}) -> Dictionary:
	var ids=[]
	for evolution in Data.get_data().evolutions:ids.append(evolution.id)
	var upgrades=[]
	var source_upgrades=value.get("upgrades",[])
	if not source_upgrades is Array:source_upgrades=[]
	for id in source_upgrades:
		if id in ids and id not in upgrades:upgrades.append(id)
	var capacity=9 if "deep-chamber" in upgrades else 6
	return {"echoes":mini(capacity,safe_count(value.get("echoes",0),capacity)),"capacity":capacity,"upgrades":upgrades,"captured":safe_count(value.get("captured",0),1000000),"released":safe_count(value.get("released",0),1000000),"convertedDamage":safe_count(value.get("convertedDamage",0),1000000),"captureCooldown":0.0,"releaseCooldown":0.0,"orbitClock":2.0,"wardCooldown":0.0,"offers":[],"choiceCount":safe_count(value.get("choiceCount",0),32),"stageChoices":0,"pendingBreak":null}
static func equipped(s: Dictionary) -> bool:
	return s.get("mode","")=="campaign" and s.get("campaign",{}).get("index",-1)>=18 and s.get("fleetProfile",{}).get("projectiveModule",false)
static func has(s: Dictionary,id: String) -> bool:
	return s.get("projective")!=null and id in s.projective.upgrades
static func event(s: Dictionary,type: String,details: Dictionary={}) -> void:
	var item={"time":s.time,"type":type};item.merge(details,true);s.events.append(item)
static func queue_evolution(s: Dictionary,wave_id: String) -> bool:
	if not equipped(s) or s.get("projective")==null or s.projective.stageChoices>=2 or wave_id=="" or s.projective.pendingBreak==wave_id:return false
	var remaining=Data.get_data().evolutions.filter(func(item):return item.id not in s.projective.upgrades)
	if remaining.is_empty():return false
	var shift=Random.imul(int(s.runSeed)^((int(s.campaign.index)+1)*731),2654435761)%remaining.size();var index=(shift+s.projective.choiceCount*3)%remaining.size();var choices=[]
	for j in range(mini(3,remaining.size())):choices.append(remaining[(index+j)%remaining.size()].id)
	s.projective.offers=choices;s.projective.pendingBreak=wave_id;s.projective.stageChoices+=1;s.phase="choosing";event(s,"evolution-offered",{"wave":wave_id,"offers":choices.duplicate()});s.lastEvent="Echo Forge: choose one transformation. The battle is paused.";return true
static func choose_evolution(s: Dictionary,id: String) -> bool:
	if s.phase!="choosing" or s.get("projective")==null or id not in s.projective.offers:return false
	var definition={}
	for item in Data.get_data().evolutions:
		if item.id==id:definition=item;break
	if definition.is_empty():return false
	s.projective.upgrades.append(id);s.projective.offers=[];s.projective.choiceCount+=1
	if id=="deep-chamber":s.projective.capacity+=3
	s.phase="running";event(s,"evolution-chosen",{"id":id});s.lastEvent=definition.name+" installed. Capture to power it.";return true
static func echo_range(s: Dictionary,shot: Dictionary) -> float:
	var center_y=s.facing*Space.space_distance(s.get("surfaceViewZ",0),s.z,s.fields);var shot_y=s.facing*Space.space_distance(s.get("surfaceViewZ",0),shot.z,s.fields);var dx=shot.x-s.x
	return minf(sqrt(dx*dx+(shot_y-center_y)*(shot_y-center_y)),minf(sqrt((dx+800)*(dx+800)+(880-shot_y-center_y)*(880-shot_y-center_y)),sqrt((dx-800)*(dx-800)+(880-shot_y-center_y)*(880-shot_y-center_y))))

static func capture_targets(s: Dictionary) -> Array:
	var projective: Variant = s.get("projective")
	if projective == null or projective.captureCooldown > 0 or not equipped(s):
		return []
	var slots: int = int(projective.capacity) - int(projective.echoes)
	if slots <= 0:
		return []
	var capture_range: float = 137.0 if has(s, "wide-net") else 105.0
	var limit: int = 3 if has(s, "quick-return") else 2
	var available: Array = s.enemyShots.filter(func(shot): return not shot.get("dead", false) and echo_range(s, shot) <= capture_range)
	available.sort_custom(func(a, b): return echo_range(s, a) < echo_range(s, b))
	return available.slice(0, mini(limit, slots))

static func capture(s: Dictionary) -> int:
	if not equipped(s) or s.get("projective")==null or s.projective.captureCooldown>0:return 0
	var p=s.projective;var gained=0
	for shot in capture_targets(s):Journey.end_shot(s,shot,"capture");gained+=1;p.echoes+=1;p.captured+=1;s.score+=30;event(s,"echo-captured",{"x":shot.x,"z":shot.z,"source":shot.get("sourceName","hostile projectile"),"pattern":shot.get("pattern","unknown")})
	p.captureCooldown=(.55 if has(s,"quick-return") else 1.1) if gained else .18
	if gained:
		var unit := "echo" if gained == 1 else "echoes"
		s.lastEvent = "Captured %d %s. Stock %d/%d." % [gained, unit, p.echoes, p.capacity]
	return gained
static func echo_shot(s: Dictionary,angle: float,damage_value: float=1) -> Dictionary:
	var shot: Dictionary={"x":s.x,"z":Space.advance_through_space(s.z,s.facing*25,s.fields),"vx":680*sin(angle),"vz":s.facing*680*cos(angle),"owner":"player","bornAt":s.time,"damage":damage_value,"payload":[],"geometryRule":"projective","echo":true}
	Journey.ensure_journey(s,shot,"player")
	return shot
static func release(s: Dictionary) -> int:
	var p=s.get("projective")
	if not equipped(s) or p==null or p.releaseCooldown>0 or p.echoes<1:return 0
	var consumed=mini(int(p.echoes),3);p.echoes-=consumed;p.released+=consumed;var split=has(s,"split-echo");var damage_value=1.5 if has(s,"echo-focus") else 1.0
	for k in range(consumed):
		var central=(k-(consumed-1)/2.0)*.18;var angles=[central-.11,central,central+.11] if split else [central]
		for angle in angles:s.shots.append(echo_shot(s,angle,damage_value))
		if has(s,"projective-twin"):s.shots.append(echo_shot(s,-central+.32,damage_value))
	p.releaseCooldown=.42 if has(s,"quick-return") else .85;event(s,"echo-released",{"count":consumed,"bullets":consumed*(3 if split else 1)+(consumed if has(s,"projective-twin") else 0)})
	var unit := "echo" if consumed == 1 else "echoes"
	s.lastEvent = "Released %d %s. Stock %d/%d." % [consumed, unit, p.echoes, p.capacity]
	return consumed
static func protect(s: Dictionary,shot: Dictionary) -> bool:
	var p=s.get("projective")
	if not equipped(s) or not has(s,"echo-ward") or p==null or p.wardCooldown>0 or p.echoes<2:return false
	p.echoes-=2;p.wardCooldown=6;p.convertedDamage+=1;Journey.end_shot(s,shot,"ward");event(s,"echo-ward",{"x":s.x,"z":s.z,"cost":2});s.lastEvent="Echo Ward: two stored echoes intercepted the hit.";return true
static func tick(s: Dictionary,input: Dictionary,dt: float) -> void:
	if not equipped(s) or s.get("projective")==null or s.phase!="running":return
	var p=s.projective
	for field in ["captureCooldown","releaseCooldown","wardCooldown","orbitClock"]:p[field]=maxf(0,p[field]-dt)
	if input.get("capture",false):capture(s)
	if input.get("release",false):release(s)
	if has(s,"echo-orbit") and p.orbitClock<=0:
		p.orbitClock=2.6
		if p.echoes>0:p.echoes-=1;p.released+=1;s.shots.append(echo_shot(s,-.32 if int(p.released)%2 else .32,.8));event(s,"echo-orbit",{"x":s.x,"z":s.z})
