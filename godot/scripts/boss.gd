extends RefCounted
const C=preload("res://scripts/campaign.gd")
const Space=preload("res://scripts/space_core.gd")
const Edge=preload("res://scripts/edge_core.gd")
const U=preload("res://scripts/upgrades.gd")
const Fleet=preload("res://scripts/fleet.gd")
const View=preload("res://scripts/combat_view.gd")
const Ecology=preload("res://scripts/ecology.gd")
const Data=preload("res://scripts/game_data.gd")
const Journey=preload("res://scripts/projectile_journey.gd")
const SEQUENCE=["fan","gap","sweep","aimed","wall","return"]

static func prepare_pattern(enemy: Dictionary,aim) :
	if not enemy.get("patternRole") or aim==null or not is_finite(float(aim.vx)) or not is_finite(float(aim.vz)) or sqrt(aim.vx*aim.vx+aim.vz*aim.vz)<1e-9:return null
	var cycle=maxi(0,int(enemy.get("patternCycle",0)));var sequence=enemy.get("patternSequence")
	if sequence==null or sequence.is_empty():sequence=SEQUENCE
	var key=sequence[cycle%sequence.size()] if enemy.patternRole=="cycle" else enemy.patternRole
	if not Data.get_data().patterns.has(key):return null
	var config=enemy.get("patternConfig")
	if config==null:config={}
	var boss=enemy.get("boss",false);var strength=1.0 if boss else clampf(enemy.get("introduction",1),0,1);var core=enemy.patternRole=="cycle"
	var count=int(config.get("count",3 if boss else 9 if core else 2 if strength<.25 else 3 if strength<.66 else 4));var beats=int(config.get("beats",2 if boss else 1 if strength<.25 else 2 if strength<.66 else 3))
	if key=="burst":count=int(config.get("count",3));beats=int(config.get("beats",3))
	if key=="spiral":count=int(config.get("count",2));beats=int(config.get("beats",4))
	if key=="crossfire":count=int(config.get("count",4));beats=int(config.get("beats",2))
	var interval=config.get("beatInterval",.18 if boss else .22);var spacing=config.get("spacing",.24 if boss else .18);var gap_width=maxi(1,int(config.get("gapWidth",2)));var gap_motion=int(config.get("gapMotion",1));var geometry=enemy.get("geometryRule","klein");var volleys=[]
	for beat in range(beats):
		var slots=maxi(5,count+2) if key=="wall" else count+(gap_width if key=="gap" else 0);var center=(slots-1)/2.0
		var gap_start=clampi(1+beat*gap_motion if cycle%2 else count-1-beat*gap_motion,0,slots-gap_width)
		var sweep=(beat-(beats-1)/2.0)*config.get("rotation",.18)*(-1 if cycle%2 else 1) if key=="sweep" else 0
		var default_spread=.11 if key=="wall" else .08 if key=="aimed" else .72 if key=="return" else .045 if key=="burst" else spacing
		var spread=config.get("spread",default_spread);var angles=[]
		if key=="spiral":
			var base=config.get("rotation",.42)*beat*(-1 if cycle%2 else 1)
			for i in range(count):angles.append(base+i*TAU/count)
		elif key=="crossfire":
			var half=maxi(1,int(floor(count/2.0)));var offset=config.get("crossAngle",.34)
			for i in range(half):angles.append(-offset+(i-(half-1)/2.0)*spacing)
			for i in range(count-half):angles.append(offset+(i-(count-half-1)/2.0)*spacing)
		else:
			var indices=[]
			for i in range(slots):
				if key!="gap" or i<gap_start or i>=gap_start+gap_width:indices.append(i)
			indices.sort_custom(func(a,b):return abs(a-center)<abs(b-center) if abs(a-center)!=abs(b-center) else a<b)
			for i in indices:angles.append((i-center)*spread+sweep)
		var volley=[]
		for ray in range(angles.size()):
			var a=angles[ray];volley.append({"vx":aim.vx*cos(a)-aim.vz*sin(a),"vz":aim.vx*sin(a)+aim.vz*cos(a),"geometryRule":geometry,"rayIndex":ray,"beatIndex":beat})
		volleys.append(volley)
	return {"patternKey":key,"patternName":Data.get_data().patterns[key].name,"beatCount":beats,"beatInterval":interval,"geometryRule":geometry,"patternRecovery":config.get("recovery",enemy.get("firePeriod",1.5 if boss and enemy.get("name","")=="Core" else 2.3)),"previewShots":volleys[0],"patternVolleys":volleys}
static func volley(cue: Dictionary,beat: int=0) -> Array:
	return cue.get("patternVolleys",[])[beat] if beat<cue.get("patternVolleys",[]).size() else []
static func point(s: Dictionary,obj: Dictionary) -> Dictionary:return {"x":obj.x,"y":C.arena_y(s,obj.z)}
static func still(s: Dictionary,obj: Dictionary) -> Array:return [{"from":point(s,obj),"to":point(s,obj),"t0":0.0,"t1":1.0}]
static func projectile_identity(s: Dictionary,shot: Dictionary) -> String:
	if not shot.has("objectId"):s.projectileSerial=s.get("projectileSerial",0)+1;shot.objectId="shot:"+str(int(s.runSeed))+":"+str(s.projectileSerial)
	return shot.objectId
static func use_projective(s: Dictionary,obj: Dictionary) -> bool:
	return C.chapter(s).get("projectiveBoss",false) or C.chapter(s).get("hybrid",false) and (C.hybrid_active(s) or s.campaign.get("hybridPhase",0)==2 and obj.get("projective",false))
static func wrap_actor(s: Dictionary,obj: Dictionary,from: Dictionary,actor_key: String="") -> Dictionary:
	var start=point(s,from);var end=point(s,obj);var result=Edge.trace_projective_surface(start,end.x-start.x,end.y-start.y) if use_projective(s,obj) else Edge.trace_klein(start,end.x-start.x,end.y-start.y)
	obj.x=result.x;obj.z=C.arena_z(s,result.y)
	if int(result.twists)%2:
		for key in ["vz","driftY","facing"]:
			if obj.has(key):obj[key]*=-1
	if use_projective(s,obj) and int(result.get("projectiveCrossings",0))%2:
		for key in ["vx","driftX"]:
			if obj.has(key):obj[key]*=-1
	if not result.crossings.is_empty():
		s.campaign.wraps+=result.crossings.size();obj.surfaceCrossings=obj.get("surfaceCrossings",0)+result.crossings.size();obj.lastCrossing=result.crossings[-1];obj.lastCrossingAt=s.time
		if actor_key=="player":s.campaign.metrics.seamCrossings+=result.crossings.size()
		if actor_key!="" and actor_key!="player":obj.telegraph=null
		if result.crossings.any(func(item):return item.edge in ["left","right"]):obj.presented=false;obj.visibleFor=0;obj.telegraph=null;obj.contacting=false
		if actor_key=="" and obj.has("gates"):obj.gates={}
		for crossing in result.crossings:
			var item=crossing.duplicate(true);item.merge({"actor":actor_key if actor_key!="" else "shot","objectId":actor_key if actor_key!="" else projectile_identity(s,obj),"rule":crossing.get("rule","klein" if crossing.edge in ["left","right"] else "periodic"),"fraction":crossing.time},true);item.time=s.time;C.event(s,"klein-crossing",item)
		if actor_key!="":
			for shot in s.shots+s.enemyShots:
				if shot.has("gates"):shot.gates.erase(actor_key)
	return result
static func phase_update(s: Dictionary,hooks) -> void:
	if s.campaign.bossPhase!="combat":return
	var total=0.0;var remaining=0.0
	for enemy in s.enemies:total+=enemy.get("maxHp",0);remaining+=maxf(0,enemy.hp)
	var ratio=remaining/maxf(1,total);var hybrid=C.chapter(s).get("hybrid",false);var curvature=C.chapter(s).get("projectiveBoss",false)
	if not hybrid and not curvature:return
	var phase=(1 if ratio>.75 else 2 if ratio>.5 else 3 if ratio>.25 else 4) if hybrid else (1 if ratio>.67 else 2 if ratio>.34 else 3)
	var phase_key="hybridPhase" if hybrid else "curvaturePhase"
	if phase==s.campaign.get(phase_key,1):return
	var previous=s.campaign.get(phase_key,1);var active=C.hybrid_active(s);var previous_break=s.campaign.get("phaseBreakUntil",0)
	s.campaign[phase_key]=phase;s.campaign.phaseBreakUntil=s.time+(2.2 if hybrid else 1.8);Journey.end_all(s,"phase-clear","enemy");s.enemyShots=[]
	if hybrid and phase>=3 and not s.campaign.has("hybridJoinReadyAt"):s.campaign.hybridJoinReadyAt=(s.time if active else previous_break) if previous>=3 else s.campaign.phaseBreakUntil
	var core=s.enemies[0];var left=s.enemies[1];var right=s.enemies[2]
	for enemy in s.enemies:enemy.telegraph=null;enemy.clock=.5 if hybrid else .7;enemy.patternCycle=0
	var text=""
	if hybrid:
		if phase==2:
			core.patternSequence=["gap","fan"];core.geometryRule="klein";core.patternConfig={"count":4,"beats":2,"recovery":1.45};left.patternSequence=["wall","fan"];left.geometryRule="klein";left.patternConfig={"count":3,"beats":2,"recovery":1.75};right.patternSequence=["return","aimed","sweep"];right.geometryRule="projective";right.projective=true;right.patternConfig={"count":3,"beats":2,"recovery":1.75};text="PROJECTIVE INTRUSION: only the Antipodal Anchor uses the new join."
		elif phase==3:
			core.patternSequence=["crossfire","gap","spiral"];core.geometryRule="hybrid";core.projective=true;core.patternConfig={"count":4,"beats":2,"recovery":1.25};left.patternSequence=["wall","return","fan"];left.geometryRule="hybrid";left.projective=true;left.patternConfig={"count":4,"beats":2,"recovery":1.45};right.patternSequence=["return","aimed","gap"];right.geometryRule="projective";right.projective=true;right.patternConfig={"count":4,"beats":2,"recovery":1.45};text="PROJECTIVE JOIN ARMING: 2.2 seconds until player top/bottom boundary changes."
		else:
			core.patternSequence=["fan","return","gap","crossfire","spiral"];core.geometryRule="hybrid";core.projective=true;core.patternConfig={"count":5,"beats":2,"recovery":1.05};left.patternSequence=["wall","sweep","return"];left.geometryRule="klein";left.projective=false;left.patternConfig={"count":4,"beats":2,"recovery":1.3};right.patternSequence=["aimed","return","gap"];right.geometryRule="projective";right.projective=true;right.patternConfig={"count":4,"beats":2,"recovery":1.3};text="HYBRID RECOVERY: the player join stays active. New attacks wait 2.2 seconds." if C.hybrid_active(s) else "HYBRID RECOVERY: the player join is arming. New attacks wait 2.2 seconds."
	else:
		if phase==2:core.patternSequence=["return","gap","crossfire"];core.patternConfig={"count":4,"beats":2,"recovery":1.2};left.patternSequence=["fan","aimed"];right.patternSequence=["wall","sweep"];text="Curvature anomaly: familiar patterns now demand captured echoes."
		else:core.patternSequence=["spiral","return","convergence","gap"];core.patternConfig={"count":5,"beats":3,"recovery":1.1};left.patternSequence=["crossfire","fan"];right.patternSequence=["return","sweep","aimed"];text="Curvature Gate convergence: choose when to release your stored power."
	s.campaign.announcement={"text":text,"until":s.time+4};s.lastEvent=text;hooks.record_event(s,"hybrid-phase" if hybrid else "curvature-phase",{"phase":phase,"previous":previous,"breakUntil":s.campaign.phaseBreakUntil,"joinReadyAt":s.campaign.get("hybridJoinReadyAt"),"playerJoinActive":C.hybrid_active(s)})
static func paths_hit(s: Dictionary,a: Array,b: Array,radius: float,projective: bool=false) -> bool:
	return Edge.paths_hit_projective(a,b,radius,Edge.KLEIN_BOUNDS) if projective else Edge.paths_hit(a,b,radius,Edge.KLEIN_BOUNDS)
static func tick(s: Dictionary,input: Dictionary,dt: float,hooks) -> void:
	if s.campaign.introRemaining>0:s.campaign.introRemaining=maxf(0,s.campaign.introRemaining-dt);return
	s.time+=dt;s.invulnerable=maxf(0,s.invulnerable-dt);s.effects=s.effects.filter(func(e):return e.until>s.time);Ecology.tick(s,input,dt);hooks.tick_damaged_drive(s)
	var old_ship={"x":s.x,"z":s.z};s.thrust=90*s.facing;hooks.steer_player(s,input.get("horizontal",0),dt,true);s.z=C.arena_z(s,C.arena_y(s,s.z)+s.thrust*dt)
	var ship_motion=wrap_actor(s,s,old_ship,"player");s.thrust=90*s.facing;s.cameraZ=s.z;s.campaign.scrollDistance+=90*dt
	if int(ship_motion.twists)%2:
		for enemy in s.enemies:enemy.presented=false;enemy.visibleFor=0;enemy.telegraph=null;enemy.contacting=false
	var motions={};var old_enemies={}
	for enemy in s.enemies:
		if enemy.hp<=0:continue
		var old={"x":enemy.x,"z":enemy.z};old_enemies[enemy.id]=old;enemy.x+=enemy.driftX*dt;enemy.z=C.arena_z(s,C.arena_y(s,enemy.z)+enemy.driftY*dt);motions[enemy.id]=wrap_actor(s,enemy,old,"enemy-"+str(enemy.id));enemy.facing=(1 if View.view_y(s,enemy.z)<0 else -1)*View.direction(s)
	phase_update(s,hooks);View.update_readiness(s,dt);hooks.settle_debts(s)
	if s.phase!="running":return
	s.fireClock=maxf(0,s.fireClock-dt)
	if input.get("fire",false) and s.fireClock<=0:
		s.shots.append({"x":s.x,"z":C.arena_z(s,C.arena_y(s,s.z)+25*s.facing),"vx":0,"vz":680*s.facing,"payload":U.loadout(s).map(func(seed):return seed.type),"bornAt":s.time,"owner":"player","geometryRule":"projective" if C.is_projective(s) else "hybrid" if C.chapter(s).get("hybrid",false) and s.campaign.get("hybridPhase",1)>=3 else "klein"});s.fireClock=.16;var fired=s.shots[-1].duplicate();fired.actor="player";hooks.record_event(s,"player-fire",fired)
	var projective=C.is_projective(s) or C.hybrid_active(s)
	for enemy in s.enemies:
		if enemy.hp<=0 or not View.ready(s,enemy):enemy.telegraph=null;enemy.contacting=false;continue
		hooks.tick_enemy_weapon(s,enemy,dt,true)
		var touching=paths_hit(s,ship_motion.segments,motions.get(enemy.id,{}).get("segments",still(s,enemy)),32,projective)
		if touching and not enemy.get("contacting",false):hooks.damage(s,"Ship contact. One hull point lost.",1,false,{"source":"ship","target":enemy.id})
		enemy.contacting=touching
	var projectile_cache: Dictionary={}
	for shot in s.shots:
		if not shot.get("dead",false):hooks.advance_projectile(s,shot,dt,old_ship,ship_motion.segments,motions,old_enemies,projectile_cache,false)
	for shot in s.enemyShots:
		if not shot.get("dead",false):hooks.advance_projectile(s,shot,dt,old_ship,ship_motion.segments,motions,old_enemies,projectile_cache,false)
	s.shots=s.shots.filter(func(shot):return not shot.get("dead",false));s.enemyShots=s.enemyShots.filter(func(shot):return not shot.get("dead",false));hooks.collect_drops(s,old_ship,ship_motion.segments)
	if s.phase=="running" and s.campaign.bossPhase=="combat" and s.enemies.all(func(enemy):return enemy.hp<=0):
		hooks.settle_debts(s,true)
		if s.phase=="running":
			Journey.end_all(s,"phase-clear","enemy");s.enemyShots=[];var last=s.campaign.get("lastDefeat",s.enemies[-1]);var position=Edge.trace_projective_surface(point(s,last),0,0) if C.chapter(s).get("hybrid",false) or C.is_projective(s) else Edge.trace_klein(point(s,last),0,0)
			s.campaign.bossPhase="salvage";s.drive.warningUntil=null;var id="curvature-seed" if C.is_projective(s) else "projective-module" if C.chapter(s).get("hybrid",false) else "klein-relay"
			s.campaign.repairPart={"id":id,"x":position.x,"z":C.arena_z(s,position.y),"collected":false,"readyAt":s.time+.35};s.lastEvent="Boss defeated. Collect the physical "+id+".";hooks.record_event(s,"boss-defeated",{"x":position.x,"y":position.y,"chapter":s.campaign.index})
	if s.phase!="running":return
	var part=s.campaign.get("repairPart")
	if s.campaign.bossPhase=="salvage" and part!=null and not part.collected:
		var position=Edge.trace_projective_surface(point(s,part),0,0) if part.id!="klein-relay" else Edge.trace_klein(point(s,part),0,0);part.x=position.x;part.z=C.arena_z(s,position.y)
		if s.time>=part.readyAt and Edge.paths_hit(ship_motion.segments,still(s,part),28,Edge.KLEIN_BOUNDS):part.collected=true;s.campaign.bossPhase="exit";s.campaign.exit={"remaining":900.0,"total":900.0,"openedAt":s.time};s.lastEvent="Part aboard. Cross the exit to bank it.";hooks.record_event(s,"drive-part-collected",{"part":part.id,"x":part.x,"z":part.z})
	var exit=s.campaign.get("exit")
	if s.campaign.bossPhase=="exit" and exit!=null and s.time>exit.openedAt:
		exit.remaining=maxf(0,exit.remaining-90*dt)
		if exit.remaining<=1e-7:
			hooks.settle_debts(s,true)
			if s.phase=="running":
				hooks.collect_drops(s,old_ship,ship_motion.segments,true)
				if not s.get("practice",false):
					if part.id=="curvature-seed":Fleet.unlock_curvature_seed(s.fleetProfile)
					elif part.id=="projective-module":Fleet.unlock_projective_module(s.fleetProfile)
					else:Fleet.unlock_klein_fleet(s.fleetProfile)
				Journey.end_all(s,"route-exit");s.phase="won";s.lastEvent="Practice extraction complete. Campaign rewards are unchanged." if s.get("practice",false) else "Curvature Seed banked. Acts I–III complete." if part.id=="curvature-seed" else "Part banked. The next Act is ready.";hooks.record_event(s,"boss-extracted",{"part":part.id,"chapter":s.campaign.index});hooks.record_event(s,"campaign-complete",{"chapter":s.campaign.index})
