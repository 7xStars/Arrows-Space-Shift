extends RefCounted
const C=preload("res://scripts/campaign.gd")
const Space=preload("res://scripts/space_core.gd")
const Edge=preload("res://scripts/edge_core.gd")
const U=preload("res://scripts/upgrades.gd")
const Fleet=preload("res://scripts/fleet.gd")
const Boss=preload("res://scripts/boss.gd")
const View=preload("res://scripts/combat_view.gd")
const Ecology=preload("res://scripts/ecology.gd")
const Random=preload("res://scripts/random.gd")
const Journey=preload("res://scripts/projectile_journey.gd")
const FoldGeometry=preload("res://scripts/fold_geometry.gd")
const STEP=1.0/120.0
const DAMAGE_PROTECTION=1.4
const ENEMY_WINDUP=.65

func create_flight(options: Dictionary={}) -> Dictionary:
	var profile=Fleet.create_profile(options.get("fleetProfile",{}));var requested=options.get("shipId",profile.get("selectedShip",0))
	var s={"mode":"campaign","runSeed":int(options.get("seed",randi()))&0xffffffff,"phase":"ready","x":0.0,"z":0.0,"time":0.0,"hull":5.0,"invulnerable":0.0,"bonusEnabled":options.get("bonusEnabled",true),"maxFolds":3,"drops":[],"dropSerial":0,"upgradeSerial":0,"upgrade":null,"warpCount":0,"labWave":0,"inventory":[],"equipped":[null,null],"selectedSlot":0,"slotCount":1,"debts":[],"stage":0,"startStage":0,"labDropClock":6,"view":{"width":900,"height":740},"effects":[],"asteroids":[],"facing":1,"cameraZ":0.0,"surfaceViewZ":0.0,"fleetProfile":profile,"shipId":requested if requested in profile.unlockedShips else 0,"lateralVelocity":0.0,"score":0,"foldBonus":0,"kills":0,"fields":[],"foldSerial":0,"foldsUsed":0,"shots":[],"enemyShots":[],"fireClock":0.0,"thrust":90.0,"enemies":[],"gates":[],"lastEvent":"Ready for flight.","events":[],"countdown":0.0,"deathRecap":null,"projective":null}
	C.enter(s,-1);s.phase="ready"
	var next=options.get("continueAt",-1)
	if next==18 and profile.projectiveModule or next==9 and profile.fleetUnlocked:C.enter(s,int(next));s.phase="ready"
	return s
func enter_chapter(s: Dictionary,index: int) -> void:
	if index>=-1 and index<=26:C.enter(s,index)
func retry(s: Dictionary) -> void:
	Journey.end_all(s,"scene-exit")
	var index=int(s.campaign.index);var checkpoint=s.campaign.checkpoint.duplicate(true)
	for key in checkpoint:s[key]=checkpoint[key]
	C.enter(s,index)
func continue_campaign(s: Dictionary) -> bool:
	if s.get("practice",false):return false
	var index=int(s.campaign.index)
	if s.phase=="cleared" and index<26:C.enter(s,index+1);return true
	if s.phase=="won" and not s.get("practice",false):
		if index==8 and s.fleetProfile.fleetUnlocked:C.enter(s,9);record_event(s,"act-transition",{"from":8,"to":9,"shipId":s.shipId});return true
		if index==17 and s.fleetProfile.projectiveModule:C.enter(s,18);record_event(s,"act-transition",{"from":17,"to":18,"shipId":s.shipId});return true
	return false
func choose_evolution(s: Dictionary,id: String) -> bool:return Ecology.choose_evolution(s,id)
func read(s: Dictionary) -> Dictionary:return s.duplicate(true)
func record_event(s: Dictionary,type: String,details: Dictionary={}) -> void:
	var data=details.duplicate(true)
	if type in ["player-fire","enemy-fire"]:
		var shots=s.shots if type=="player-fire" else s.enemyShots
		if not shots.is_empty():Journey.ensure_journey(s,shots[-1]);data.objectId=Boss.projectile_identity(s,shots[-1])
	C.event(s,type,data)
	if type in ["player-fire","fold","unfold"]:C.tutorial_action(s,type)
	if type=="enemy-fire":C.tutorial_enemy_fire(s,data)
	var metrics=s.get("campaign",{}).get("metrics")
	if metrics==null:return
	if type=="fold":metrics.folds+=1;C.credit_fold(s,data.get("automatic",false))
	elif type=="unfold":metrics.unfolds+=1;C.credit_fold(s,data.get("automatic",false))
	elif type=="graze":metrics.grazes+=1
	elif type=="damage":metrics.damage+=data.get("amount",1)
func steer_player(s: Dictionary,horizontal: float,dt: float,wrap: bool=false) -> void:
	var ship=Fleet.active_ship(s);var direction=clampf(horizontal,-1,1);var target=direction*ship.speed
	if ship.get("acceleration",0):
		var velocity=s.get("lateralVelocity",0);var rate=ship.acceleration if direction!=0 and direction*velocity>=0 else ship.braking;var change=rate*dt
		s.lateralVelocity=velocity+clampf(target-velocity,-change,change)
	else:s.lateralVelocity=target
	var next=s.x+s.lateralVelocity*dt;s.x=next if wrap else clampf(next,-350,350)
	if not wrap and s.x!=next:s.lateralVelocity=0
func tick_damaged_drive(s: Dictionary) -> void:
	if C.is_tutorial(s) or s.drive.status!="damaged" or s.phase!="running" or C.chapter(s).get("waveScript","") in ["fold-timing","klein-mastery"] or C.is_boss(s) and s.campaign.bossPhase!="combat":return
	var drive=s.drive
	if drive.warningUntil!=null:
		if s.time<drive.warningUntil:return
		drive.warningUntil=null;drive.attempts+=1
		if Space.add_fold(s):drive.faults+=1;s.fields[-1].source="drive-fault";record_event(s,"fold",{"fields":s.fields.size(),"automatic":true});record_event(s,"drive-fault",{"fields":s.fields.size()});s.lastEvent="Damaged Warp Drive: space folded. Right Shift unfolds the latest field."
		else:record_event(s,"drive-fault-blocked",{"fields":s.fields.size()})
		var random=Random.new(int(s.runSeed)^0x4b1e1,int(s.campaign.index)*101+int(drive.attempts));drive.nextFaultAt=s.time+14+random.next_float()*8;return
	if s.time>=drive.nextFaultAt:drive.warningUntil=s.time+1.4;record_event(s,"drive-warning",{"due":drive.warningUntil});s.lastEvent="Damaged Warp Drive: fold surge incoming. Prepare to unfold with Right Shift."
static func segment_near(ax: float,az: float,bx: float,bz: float,radius: float) -> bool:
	var dx=bx-ax;var dz=bz-az;var length=dx*dx+dz*dz;var t=clampf(-(ax*dx+az*dz)/(length if length else 1),0,1)
	return sqrt((ax+dx*t)*(ax+dx*t)+(az+dz*t)*(az+dz*t))<=radius
func admit_player_hit(s: Dictionary,kind: String="impact",position: Dictionary={}) -> bool:
	if s.phase!="running":return false
	if s.invulnerable>0:record_event(s,kind+"-absorbed",{"x":position.get("x",s.x),"z":position.get("z",s.z),"target":"player"});return false
	s.invulnerable=DAMAGE_PROTECTION;return true
func damage(s: Dictionary,reason: String,amount: float=1,retained: bool=false,details: Dictionary={}) -> bool:
	if s.phase!="running" or not retained and not admit_player_hit(s,"contact" if details.get("source","")=="ship" else "impact",s):return false
	s.hull=maxf(0,s.hull-amount);s.lastEvent=reason;var data=details.duplicate(true);data.merge({"reason":reason,"hull":s.hull,"amount":amount,"retained":retained,"x":s.x,"z":s.z},true);record_event(s,"damage",data)
	if s.hull<=0:
		var title="Stored impact damage" if retained else "Carrier collision" if details.get("source","")=="ship" else "Asteroid collision" if details.get("source","")=="asteroid" else str(details.get("sourceName","Enemy projectile"))+" hit"
		s.phase="lost";s.deathRecap={"title":title,"detail":"An earlier admitted hit resolved." if retained else "The final hit was recorded.","details":details.duplicate(true)};s.lastEvent="Hull lost. "+title+"."
	return true
func shot_damage_details(shot: Dictionary) -> Dictionary:
	return {"source":"projectile","sourceId":shot.get("sourceId"),"sourceName":shot.get("sourceName"),"pattern":shot.get("pattern"),"patternName":shot.get("patternName"),"geometryRule":shot.get("geometryRule","klein"),"surfaceCrossings":shot.get("surfaceCrossings",0),"lastEdge":shot.get("lastCrossing",{}).get("edge",shot.get("lastEdge")),"damageMultiplier":shot.get("damage",1)}
func note_fold_transition(s: Dictionary,shot: Dictionary,previous_depth: int) -> void:
	var depth=Space.fold_depth_at(shot.z,s.fields);shot.foldDepth=depth
	if previous_depth==depth:return
	shot.foldTransitions=shot.get("foldTransitions",0)+1;shot.foldChangedAt=s.time;record_event(s,"fold-entry" if depth>previous_depth else "fold-exit",{"actor":"shot","owner":shot.get("owner","unknown"),"x":shot.x,"z":shot.z,"depth":depth})
func graze_player(s: Dictionary,shot: Dictionary) -> bool:
	if shot.get("grazed",false) or s.phase!="running":return false
	shot.grazed=true;s.score+=5;record_event(s,"graze",{"sourceId":shot.get("sourceId"),"pattern":shot.get("pattern"),"x":shot.x,"z":shot.z,"points":5});s.lastEvent="Graze +5.";return true
func destroy_enemy(s: Dictionary,enemy: Dictionary) -> void:
	if enemy.get("destroyed",false):return
	enemy.destroyed=true;enemy.telegraph=null;var bonus=50*Space.fold_depth_at(enemy.z,s.fields) if s.bonusEnabled else 0;var points=100+bonus
	s.foldBonus+=bonus;s.score+=points;s.kills+=1;s.campaign.defeated+=1;s.campaign.metrics.kills+=1
	if C.is_boss(s):s.campaign.lastDefeat={"x":enemy.x,"z":enemy.z,"id":enemy.id}
	s.lastEvent="Enemy destroyed. +%d points." % points;record_event(s,"target-hit",{"target":enemy.id,"bonus":bonus,"x":enemy.x,"z":enemy.z,"visible":View.in_view(s,enemy),"presented":enemy.get("presented",false)});s.effects.append({"type":"defeat","x":enemy.x,"z":enemy.z,"start":s.time,"until":s.time+.7,"points":points})
	if enemy.get("dropsUpgrade",false):
		var seeds=U.loadout(enemy)
		for i in range(seeds.size()):U.make_drop(s,enemy.x+((-22 if i==0 else 22) if seeds.size()>1 else 0),enemy.z,"enemy-"+str(enemy.id),seeds[i].type,seeds[i].polarity)
	if enemy.get("linkGroup")!=null:
		for survivor in s.enemies:
			if survivor.hp<=0 or survivor.get("destroyed",false) or survivor.get("linkGroup")!=enemy.linkGroup:continue
			survivor.patternRole="cycle"
			if survivor.get("patternSequence")==null:survivor.patternSequence=["fan","gap","return","sweep"]
			survivor.firePeriod=maxf(.85,survivor.get("firePeriod",1.6)*.78);var config=survivor.get("patternConfig")
			if config==null:config={}
			config=config.duplicate(true);config.recovery=maxf(.85,config.get("recovery",1.5)*.78);survivor.patternConfig=config;survivor.telegraph=null;survivor.clock=.35
		record_event(s,"linked-pattern-shift",{"group":enemy.linkGroup,"target":enemy.id})
func hit_enemy(s: Dictionary,enemy: Dictionary,amount: float) -> void:
	if C.tutorial_keeps_target(s,enemy):
		amount=minf(amount,maxf(0.0,enemy.hp-enemy.maxHp*0.25))
		if amount<=0.0:
			return
	enemy.hp-=amount;enemy.hitUntil=s.time+.15;record_event(s,"enemy-hit",{"target":enemy.id,"amount":amount,"x":enemy.x,"z":enemy.z});s.effects.append({"type":"hit","x":enemy.x,"z":enemy.z,"start":s.time,"until":s.time+.2})
	if enemy.hp<=0:destroy_enemy(s,enemy)
func impact(s: Dictionary,actor: Dictionary,shot: Dictionary) -> void:
	var player=is_same(actor,s)
	if player and Ecology.protect(s,shot):return
	var amount=shot.get("damage",1)
	if shot.get("impactDelay",0):
		if player and not admit_player_hit(s,"impact",shot):Journey.end_shot(s,shot,"absorption");return
		var debt={"target":"player" if player else actor.id,"due":s.time+shot.impactDelay,"amount":amount,"x":actor.x,"z":actor.z,"details":shot_damage_details(shot) if player else null};s.debts.append(debt);record_event(s,"damage-debt",debt)
		var recipient: String = "your ship" if player else str(actor.get("name", "Carrier %s" % actor.id))
		s.lastEvent = "Stored damage to %s · %s" % [recipient, str(amount)]
	elif player:
		if not damage(s,"Shot impact. Hull damage received.",amount,false,shot_damage_details(shot)):Journey.end_shot(s,shot,"absorption");return
	else:hit_enemy(s,actor,amount)
	Journey.end_shot(s,shot,"impact")
func settle_debts(s: Dictionary,all: bool=false) -> void:
	var pending=[]
	for debt in s.debts:
		if not all and debt.due>s.time:pending.append(debt);continue
		var enemy=null
		if str(debt.target)!="player":
			for actor in s.enemies:
				if actor.id==debt.target:enemy=actor;break
		if enemy!=null and enemy.hp>0 and not enemy.get("escaped",false) and not View.ready(s,enemy):pending.append(debt);continue
		record_event(s,"debt-paid",{"target":debt.target,"amount":debt.amount,"x":enemy.x if enemy!=null else s.x,"z":enemy.z if enemy!=null else s.z})
		if str(debt.target)=="player":damage(s,"Stored impact applied. Hull damage received.",debt.amount,true,debt.details if debt.get("details")!=null else {})
		elif enemy!=null and enemy.hp>0 and not enemy.get("escaped",false):hit_enemy(s,enemy,debt.amount)
	s.debts=pending
func _boss_aim_sample(s: Dictionary,source: Dictionary,player: Dictionary,forward: float,speed: float,origin_z: float,time: float,shot_fields: Array) -> Dictionary:
	var target=Edge.trace_klein(player,0,forward*time);var dx=target.x-source.x;var dy=target.y-source.y;var length=sqrt(dx*dx+dy*dy);var aim_z=C.arena_z(s,target.y)
	var travel=abs(Space.space_distance(origin_z,aim_z,shot_fields))*length/(speed*abs(dy)) if abs(dy)>1e-8 else length*Space.metric_at(origin_z,s.fields)/speed
	return {"aimX":target.x,"aimZ":aim_z,"vx":dx/(length if length else 1)*speed,"vz":dy/(length if length else 1)*speed,"error":travel-time}
func locked_enemy_aim(s: Dictionary,enemy: Dictionary,boss: bool=false):
	if boss:
		var forward=90 if C.is_surface(s) else 90*s.facing;var speed=enemy.get("shotSpeed",155);var source=Edge.trace_klein({"x":enemy.x,"y":C.arena_y(s,enemy.z)},enemy.get("driftX",0)*.65,enemy.get("driftY",0)*.65);var player=Edge.trace_klein({"x":s.x,"y":C.arena_y(s,s.z)},0,forward*.65);var origin_z=C.arena_z(s,source.y);var cuts=[0.0];var seam=(950-player.y if forward>0 else -70-player.y)/forward
		var shot_fields=[]
		for field in s.fields:
			var item=field.duplicate();item.factor*=item.factor;shot_fields.append(item)
		if seam>0 and seam<7:cuts.append(seam)
		cuts.append(7.0);var aim=null
		for i in range(1,cuts.size()):
			if aim!=null:break
			var end=cuts[i]-1e-7;var left=cuts[i-1]+1e-7;var a=_boss_aim_sample(s,source,player,forward,speed,origin_z,left,shot_fields)
			while left<end and aim==null:
				var right=minf(end,left+.05);var b=_boss_aim_sample(s,source,player,forward,speed,origin_z,right,shot_fields)
				if a.error*b.error<=0:
					var lo=left;var hi=right;var low_error=a.error
					for step in range(28):
						var middle=(lo+hi)/2;var error=_boss_aim_sample(s,source,player,forward,speed,origin_z,middle,shot_fields).error
						if error*low_error>0:lo=middle;low_error=error
						else:hi=middle
					aim=_boss_aim_sample(s,source,player,forward,speed,origin_z,(lo+hi)/2,shot_fields)
				left=right;a=b
		if aim==null:aim=_boss_aim_sample(s,source,player,forward,speed,origin_z,0,shot_fields)
		return {"aimX":aim.aimX,"aimZ":aim.aimZ,"vx":aim.vx,"vz":aim.vz}
	var aim_x=s.x;var forward=s.thrust;var player_z=Space.advance_through_space(s.z,forward*.65,s.fields);var source_x=enemy.x+enemy.get("driftX",0)*.65
	if not C.chapter(s).get("klein",false) and not C.is_surface(s) and abs(source_x)>330:source_x=sign(source_x)*(660-abs(source_x))
	var source_z=Space.advance_through_space(enemy.z,enemy.get("driftY",0)*.65,s.fields);var delta=Space.space_distance(player_z,source_z,s.fields);var direction=-sign(delta) if delta!=0 else -1;var origin_z=Space.advance_through_space(source_z,20*direction,s.fields);var speed=enemy.get("shotSpeed",145);var vz=speed*direction
	if _aim_gap(s,player_z,origin_z,forward,vz,0,direction)<=0 or _aim_gap(s,player_z,origin_z,forward,vz,20,direction)>=0:return null
	var lo=0.0;var hi=20.0
	for i in range(36):
		var middle=(lo+hi)/2
		if _aim_gap(s,player_z,origin_z,forward,vz,middle,direction)>0:lo=middle
		else:hi=middle
	var aim_z=Space.advance_through_space(player_z,forward*hi,s.fields);var travel=abs(Space.space_distance(origin_z,Space.advance_projectile(origin_z,vz*hi,s.fields),s.fields))/speed
	return {"aimX":aim_x,"aimZ":aim_z,"vx":(aim_x-source_x)/maxf(.05,travel),"vz":vz}
func _aim_gap(s: Dictionary,player_z: float,origin_z: float,forward: float,vz: float,t: float,direction: float) -> float:
	return -direction*Space.space_distance(Space.advance_through_space(player_z,forward*t,s.fields),Space.advance_projectile(origin_z,vz*t,s.fields),s.fields)
func special_phase(s: Dictionary,enemy: Dictionary) -> void:
	if enemy.get("name","")!="Klein Warden" or enemy.hp<=0:return
	var ratio=enemy.hp/maxf(1,enemy.get("maxHp",enemy.hp));var phase=1 if ratio>.75 else 2 if ratio>.5 else 3 if ratio>.25 else 4
	if enemy.get("specialPhase",1)==phase:enemy.specialPhase=phase;return
	enemy.specialPhase=phase;enemy.telegraph=null;enemy.clock=.65;enemy.phaseBreakUntil=s.time+.65
	for shot in s.enemyShots:
		if not shot.get("dead",false) and shot.get("sourceId")==enemy.id:Journey.end_shot(s,shot,"phase-clear")
	s.enemyShots=s.enemyShots.filter(func(shot):return not shot.get("dead",false))
	enemy.patternSequence=["gap","sweep","return"] if phase==2 else ["wall","crossfire","return"] if phase==3 else ["fan","return","gap","sweep","wall","crossfire"];enemy.patternConfig={"count":4 if phase==2 else 5,"beats":2,"recovery":1.2 if phase==2 else 1.05 if phase==3 else .92}
	if phase==2:enemy.patternConfig.gapWidth=2
	record_event(s,"miniboss-phase",{"target":enemy.id,"name":enemy.name,"phase":phase,"x":enemy.x,"z":enemy.z})
func _quick_route_weapon(s: Dictionary,enemy: Dictionary) -> bool:
	var chapter: Dictionary = C.chapter(s)
	return C.is_scrolling(s) and not C.is_tutorial(s) and not chapter.get("calm",false) and not chapter.has("waveScript") and enemy.get("role","") != "miniboss"

func tick_enemy_weapon(s: Dictionary,enemy: Dictionary,dt: float,boss: bool=false) -> void:
	if not C.tutorial_weapon_allowed(s):return
	special_phase(s,enemy)
	if enemy.get("phaseBreakUntil",0)>s.time:enemy.telegraph=null;return
	if enemy.get("shield",false) or not enemy.get("waveActive",true):return
	if C.is_scrolling(s) and s.campaign.get("currentWave",{}).get("kind","")=="break" or boss and s.campaign.get("phaseBreakUntil",0)>s.time:enemy.telegraph=null;return
	var ready: bool = View.ready(s,enemy)
	var quick: bool = not boss and _quick_route_weapon(s,enemy)
	if not ready and not (quick and enemy.get("routeActive",true) and View.can_prepare(s,enemy)):
		enemy.telegraph=null
		return
	var distance=Space.space_distance(s.z,enemy.z,s.fields);var in_range=boss or abs(distance)>110 and abs(distance)<920
	if not in_range:
		enemy.telegraph=null
		return
	var cue=enemy.get("telegraph")
	if cue!=null:
		cue.remaining=maxf(0,cue.due-s.time)
		if cue.remaining>1e-8 or not ready:return
		var direction=sign(cue.vz) if cue.vz!=0 else -1;var volley=Boss.volley(cue,int(cue.get("beatIndex",0))) if cue.has("patternKey") else [{"vx":cue.vx,"vz":cue.vz}]
		for velocity in volley:
			var geometry=velocity.get("geometryRule",cue.get("geometryRule",enemy.get("geometryRule","klein")));var shot={"x":enemy.x,"z":enemy.z if boss else C.arena_z(s,C.arena_y(s,enemy.z)+20*direction) if C.is_surface(s) else Space.advance_through_space(enemy.z,20*direction,s.fields),"payload":U.loadout(enemy).map(func(seed):return seed.type),"bornAt":s.time,"pattern":cue.get("patternKey"),"patternName":cue.get("patternName"),"owner":"enemy","sourceId":enemy.id,"sourceName":enemy.get("name","Carrier "+str(enemy.id)),"geometryRule":geometry,"projective":geometry in ["projective","hybrid"]};shot.merge(velocity,true);s.enemyShots.append(shot);var details=shot.duplicate();details.merge({"actor":"enemy-"+str(enemy.id),"target":enemy.id,"aimX":cue.aimX,"aimZ":cue.aimZ,"beat":cue.get("beatIndex",0)},true);record_event(s,"enemy-fire",details)
		if cue.has("patternKey") and cue.get("beatIndex",0)+1<cue.beatCount:cue.beatIndex=cue.get("beatIndex",0)+1;cue.phase="burst";cue.due+=cue.beatInterval;cue.remaining=maxf(0,cue.due-s.time);cue.previewShots=Boss.volley(cue,int(cue.beatIndex))
		else:
			enemy.telegraph=null;enemy.clock=cue.get("patternRecovery",enemy.get("firePeriod",1.5 if boss and enemy.get("name","")=="Core" else 2.3 if boss else 2.3+int(enemy.id)%3*.2))
			if quick:enemy.clock*=.9
			if cue.has("patternKey"):enemy.patternCycle=enemy.get("patternCycle",0)+1
		return
	if quick and not enemy.get("routeWeaponStarted",false):
		enemy.routeWeaponStarted=true
		enemy.clock=0.0
	enemy.clock-=dt
	if enemy.clock>0:return
	if s.time<s.nextEnemyWindup or s.enemies.filter(func(e):return e.get("telegraph")!=null).size()>=C.chapter(s).get("maxConcurrentWarnings",2):return
	var aim=locked_enemy_aim(s,enemy,boss or C.is_surface(s))
	if aim==null:return
	var tell=aim.duplicate();var pattern=Boss.prepare_pattern(enemy,aim)
	if pattern!=null:tell.merge(pattern,true)
	tell.merge({"phase":"tell","beatIndex":0,"x":aim.aimX,"z":aim.aimZ,"duration":.65,"remaining":.65,"startedAt":s.time,"due":s.time+.65},true);enemy.telegraph=tell
	var details=aim.duplicate();details.merge({"actor":"enemy-"+str(enemy.id),"target":enemy.id,"x":enemy.x,"z":enemy.z,"duration":.65,"patternKey":tell.get("patternKey")},true);record_event(s,"enemy-windup",details)
	if tell.has("patternKey"):record_event(s,"pattern-warning",{"actor":"enemy-"+str(enemy.id),"target":enemy.id,"patternKey":tell.patternKey,"patternName":tell.patternName,"x":enemy.x,"z":enemy.z})
	var c=C.chapter(s);s.nextEnemyWindup=s.time+(1.1 if c.get("calm",false) else .7 if c.get("number",0)==1 else .75 if c.get("klein",false) or c.get("kleinSurface",false) else .55)
func contact_time(s: Dictionary,paths: Array,obj: Dictionary,radius: float,moving: bool=false,half_width: float=0) -> float:
	var earliest=INF
	for path in paths:
		var a=path.get("shipFrom",obj) if moving else obj;var b=path.get("shipTo",obj) if moving else obj;var relative_x=path.from.x-a.x;var x=sign(relative_x)*maxf(0,abs(relative_x)-half_width);var z=Space.space_distance(a.z,path.from.z,s.fields);var relative_end=path.to.x-b.x;var dx=sign(relative_end)*maxf(0,abs(relative_end)-half_width)-x;var dz=Space.space_distance(b.z,path.to.z,s.fields)-z
		if not is_finite(x+z+dx+dz):continue
		var aa=dx*dx+dz*dz;var bb=2*(x*dx+z*dz);var cc=x*x+z*z-radius*radius;var t=0.0
		if cc>0:
			var discriminant=bb*bb-4*aa*cc
			if aa==0 or discriminant<0:continue
			t=(-bb-sqrt(discriminant))/(2*aa)
			if t<0 or t>1:continue
		earliest=minf(earliest,path.get("t0",0)+(path.get("t1",1)-path.get("t0",0))*t)
	return earliest
func break_asteroid(s: Dictionary,rock: Dictionary,owner: String) -> void:
	if rock.get("destroyed",false):return
	rock.hp=0;rock.destroyed=true;var points=10 if owner=="player" else 0;s.score+=points;s.campaign.asteroidsBroken+=1;s.effects.append({"type":"asteroid","x":rock.x,"z":rock.z,"start":s.time,"until":s.time+.55,"points":points,"color":"#c4bdac"});record_event(s,"asteroid-broken",{"target":rock.id,"owner":owner,"x":rock.x,"z":rock.z,"points":points});s.lastEvent="Asteroid broken. +10 points." if owner=="player" else "Enemy fire broke an asteroid." if owner=="enemy" else "Asteroid impact. The rock broke."
func intercept_asteroid(s: Dictionary,paths: Array,shot: Dictionary,owner: String,before: float=INF,bodies: Array=[]) -> bool:
	var hit=null;var hit_time=INF
	for rock in s.asteroids:
		if rock.hp<=0 or not rock.get("presented",false) or not View.in_view(s,rock):continue
		var time=contact_time(s,paths,rock,rock.radius)
		if is_finite(time) and time<hit_time:hit=rock;hit_time=time
	if hit==null or hit_time>before:return false
	for body in bodies:
		if contact_time(s,paths,body.object,body.radius,body.get("moving",false),body.get("halfWidth",0))<hit_time:return false
	hit.hp-=shot.get("damage",1);hit.hitUntil=s.time+.12;Journey.end_shot(s,shot,"impact");record_event(s,"asteroid-hit",{"target":hit.id,"owner":owner,"amount":shot.get("damage",1)})
	if hit.hp<=0:break_asteroid(s,hit,owner)
	return true
func route_screen_paths(s: Dictionary,paths: Array) -> Array:
	var result=[]
	for path in paths:result.append({"from":{"x":path.from.x,"y":C.arena_y(s,path.from.z)},"to":{"x":path.to.x,"y":C.arena_y(s,path.to.z)},"t0":path.get("t0",0),"t1":path.get("t1",1)})
	return result
func surface_hit(s: Dictionary,a: Array,b: Array,radius: float) -> bool:
	return Edge.paths_hit_projective(a,b,radius,Edge.KLEIN_BOUNDS) if C.is_projective(s) else Edge.paths_hit(a,b,radius,Edge.KLEIN_BOUNDS)
func collect_drops(s: Dictionary,old: Dictionary,motion=null,recover_all: bool=false) -> void:
	var klein=C.is_boss(s) or C.is_surface(s)
	for drop in s.drops:
		if drop.get("collected",false):continue
		if klein:
			var position=C.surface_trace(s,{"x":drop.x,"y":C.arena_y(s,drop.z)},0,0);drop.x=position.x;drop.z=C.arena_z(s,position.y)
			var paths=motion if motion!=null else Boss.still(s,s)
			if recover_all or surface_hit(s,paths,Boss.still(s,drop),28):U.collect_drop(s,drop)
		elif segment_near(old.x-drop.x,Space.space_distance(drop.z,old.z,s.fields),s.x-drop.x,Space.space_distance(drop.z,s.z,s.fields),28):U.collect_drop(s,drop)
	if klein:s.drops=s.drops.filter(func(drop):return not drop.get("collected",false))
func _paths_hit_actor(s: Dictionary,paths: Array,actor: Dictionary,radius: float) -> bool:
	if C.is_surface(s):return surface_hit(s,route_screen_paths(s,paths),Boss.still(s,actor),radius)
	for path in paths:
		if segment_near(path.from.x-actor.x,Space.space_distance(actor.z,path.from.z,s.fields),path.to.x-actor.x,Space.space_distance(actor.z,path.to.z,s.fields),radius):return true
	return false
func _paths_hit_player(s: Dictionary,paths: Array,old: Dictionary,half_width: float,radius: float) -> bool:
	if C.is_surface(s):return surface_hit(s,route_screen_paths(s,paths),s.campaign.get("shipMotion",{}).get("segments",Boss.still(s,s)),radius)
	for path in paths:
		var a=path.get("shipFrom",old);var b=path.get("shipTo",s);var dx=path.from.x-a.x;var ex=path.to.x-b.x
		if segment_near(sign(dx)*maxf(0,abs(dx)-half_width),Space.space_distance(a.z,path.from.z,s.fields),sign(ex)*maxf(0,abs(ex)-half_width),Space.space_distance(b.z,path.to.z,s.fields),radius):return true
	return false

func projectile_rock_contact(shot: Dictionary,s: Dictionary,rock: Dictionary,owner: String) -> void:
	rock.hp-=shot.get("damage",1);rock.hitUntil=s.time+.12
	record_event(s,"asteroid-hit",{"target":rock.id,"owner":owner,"amount":shot.get("damage",1)})
	Journey.end_shot(s,shot,"impact")
	if rock.hp<=0:break_asteroid(s,rock,owner)

func projectile_actor_contact(shot: Dictionary,s: Dictionary,actor: Dictionary) -> void:
	impact(s,actor,shot)

func projectile_graze(paths: Array,s: Dictionary,shot: Dictionary,player_paths: Array,prepared: Variant) -> void:
	if shot.get("grazed",false):return
	var radius: float=Fleet.active_ship(s).coreRadius+14.0
	var near_time: float=Edge.prepared_paths_time(paths,prepared,radius,shot.get("halfWidth",0.0)) if prepared!=null else Edge.paths_time(paths,player_paths,radius,null,shot.get("halfWidth",0.0))
	if is_finite(near_time):graze_player(s,shot)

func projectile_target_active(actor: Dictionary) -> bool:
	return actor.get("hp",1)>0 and not actor.get("escaped",false)

func _projectile_context(s: Dictionary,owner: String,old_ship: Dictionary,ship_motion: Variant,enemy_motions: Dictionary) -> Dictionary:
	var klein_route: bool=C.is_surface(s)
	var surface: bool=C.is_boss(s) or klein_route
	var geometry:=FoldGeometry.new(s.fields)
	var origin: float=s.get("surfaceViewZ",0.0) if klein_route else 0.0
	var axis_sign: float=float(s.facing) if klein_route else 1.0
	var to_point: Callable=func(z: float)->float:return axis_sign*geometry.distance(origin,z)
	var from_y: Callable=func(y: float)->float:return geometry.advance(origin,axis_sign*y)
	var context: Dictionary={"owner":owner,"surface":surface,"projective":false,
		"to_point":to_point,"from_y":from_y,"axis_sign":axis_sign,"geometry":geometry,
		"clear_gates":C.is_boss(s),"contacts":[],"receivers":[],
		"on_fold":func(item: Dictionary,previous: int)->void:note_fold_transition(s,item,previous)}
	var player_paths: Array=[]
	if ship_motion!=null:player_paths=ship_motion
	elif C.is_surface(s):player_paths=s.campaign.get("shipMotion",{}).get("segments",Boss.still(s,s))
	else:
		var old: Dictionary=old_ship if not old_ship.is_empty() else s
		player_paths=[{"from":{"x":old.x,"y":to_point.call(float(old.z))},"to":{"x":s.x,"y":to_point.call(float(s.z))},"t0":0.0,"t1":1.0}]
	for rock in s.asteroids:
		if rock.hp<=0 or not rock.get("presented",false) or not View.in_view(s,rock):continue
		var point: Dictionary={"x":rock.x,"y":to_point.call(float(rock.z))}
		context.contacts.append({"paths":[{"from":point,"to":point,"t0":0.0,"t1":1.0}],"radius":rock.radius,
			"on_hit":Callable(self,"projectile_rock_contact").bind(s,rock,owner),"active":Callable(self,"projectile_target_active").bind(rock)})
	if owner=="player":
		for enemy in s.enemies:
			if enemy.hp<=0 or enemy.get("escaped",false) or enemy.stage>s.stage or not View.ready(s,enemy):continue
			var point: Dictionary={"x":enemy.x,"y":to_point.call(float(enemy.z))}
			var motion: Dictionary=enemy_motions.get(enemy.id,{})
			var paths: Array=motion.get("segments",[{"from":point,"to":point,"t0":0.0,"t1":1.0}])
			context.contacts.append({"paths":paths,"radius":26.0,"on_hit":Callable(self,"projectile_actor_contact").bind(s,enemy),"active":Callable(self,"projectile_target_active").bind(enemy)})
			if not U.loadout(enemy).is_empty():context.receivers.append({"actor":enemy,"key":U._actor_key(s,enemy),"facing":enemy.get("facing",-1),"paths":paths,"active":Callable(self,"projectile_target_active").bind(enemy)})
	else:
		context.contacts.append({"paths":player_paths,"radius":Fleet.active_ship(s).coreRadius,"half_width":0.0,
			"on_hit":Callable(self,"projectile_actor_contact").bind(s,s)})
		if not U.loadout(s).is_empty():context.receivers.append({"actor":s,"key":"player","facing":s.facing,"paths":player_paths})
	if surface:
		for contact in context.contacts:
			contact.path_images={}
	context.player_paths=player_paths
	return context

func advance_projectile(s: Dictionary,shot: Dictionary,dt: float,old_ship: Dictionary={},ship_motion: Variant=null,enemy_motions: Dictionary={},old_enemies: Dictionary={},tick_cache: Variant=null,collect_world_paths: bool=true) -> Dictionary:
	var owner: String=shot.get("owner","enemy")
	var base: Dictionary={}
	if tick_cache is Dictionary and tick_cache.has(owner):base=tick_cache[owner]
	else:
		base=_projectile_context(s,owner,old_ship,ship_motion,enemy_motions)
		if tick_cache is Dictionary:tick_cache[owner]=base
	var context: Dictionary=base.duplicate()
	context.collect_world_paths=collect_world_paths
	context.projective=Boss.use_projective(s,shot) if C.is_boss(s) else C.is_projective(s)
	var player_paths: Array=context.player_paths
	var prepared: Variant=null
	if owner=="enemy":
		context.contacts=context.contacts.duplicate()
		context.contacts[-1]=context.contacts[-1].duplicate()
		context.contacts[-1].half_width=shot.get("halfWidth",0.0)
		if context.surface:prepared=Journey.prepared_contact(context.contacts[-1],context.projective)
		context.on_before_end=Callable(self,"projectile_graze").bind(s,shot,player_paths,prepared)
	var depth: int=Space.fold_depth_at(shot.z,s.fields)
	note_fold_transition(s,shot,int(shot.get("foldDepth",depth)))
	var result: Dictionary=Journey.advance(s,shot,dt,context)
	if owner=="enemy" and not result.contact and not shot.get("dead",false):projectile_graze(result.physical_paths,s,shot,player_paths,prepared)
	return result

func accept_tutorial_input(s: Dictionary,input: Dictionary,prompt: String) -> bool:
	var accepted: bool
	match prompt:
		"dodge-left": accepted=input.get("leftPressed",false)
		"dodge-right": accepted=input.get("rightPressed",false)
		"fire": accepted=input.get("firePressed",false)
		"fold": accepted=input.get("fold",false) and Space.add_fold(s)
		"unfold": accepted=input.get("unfold",false) and Space.remove_fold(s)!=null
	if not accepted:
		return false
	C.resume_tutorial(s)
	if prompt=="fire":
		s.fireClock=0.0
	elif prompt in ["fold","unfold"]:
		record_event(s,prompt,{"fields":s.fields.size()})
	return true

func tick(s: Dictionary,input: Dictionary,dt: float=STEP) -> void:
	if s.phase!="running":return
	var hold_prompt: String=C.tutorial_hold_prompt(s)
	if hold_prompt.is_empty():
		if input.get("fold",false) and Space.add_fold(s):record_event(s,"fold",{"fields":s.fields.size()})
		if input.get("unfold",false) and Space.remove_fold(s)!=null:record_event(s,"unfold",{"fields":s.fields.size()})
	elif not accept_tutorial_input(s,input,hold_prompt):
		return
	if s.countdown>0:s.countdown=maxf(0,s.countdown-dt);return
	s.lastAxialInput=0
	if C.is_boss(s):Boss.tick(s,input,dt,self);return
	var horizontal: float=input.get("horizontal",0)
	if hold_prompt=="dodge-left":
		horizontal=-1.0
	elif hold_prompt=="dodge-right":
		horizontal=1.0
	elif hold_prompt=="fire":
		horizontal=0.0
	var old_z=s.z;var old_x=s.x;s.time+=dt;tick_damaged_drive(s);s.invulnerable=maxf(0,s.invulnerable-dt);steer_player(s,horizontal,dt,C.is_surface(s));s.thrust=0
	var route=C.is_surface(s);var camera_from=s.surfaceViewZ if route else s.cameraZ;var facing_from=s.facing;var offset=C.arena_y(s,s.z)
	if C.is_scrolling(s):s.cameraZ=minf(C.chapter(s).routeLength,Space.advance_through_space(s.cameraZ,90*dt,s.fields))
	var frame_turned=false
	if route:
		s.surfaceViewZ=Space.advance_through_space(camera_from,facing_from*90*dt,s.fields);var target_y=clampf(offset,25,405);var motion=C.surface_trace(s,{"x":old_x,"y":offset},s.x-old_x,target_y-offset);s.x=motion.x;s.z=C.arena_z(s,motion.y);frame_turned=int(motion.twists)%2!=0
		if frame_turned:
			s.facing=-facing_from;s.surfaceViewZ=Space.advance_through_space(s.z,-s.facing*target_y,s.fields)
			for enemy in s.enemies:
				if enemy.get("routeActive",false):enemy.driftY=-enemy.get("driftY",0)
				enemy.presented=false;enemy.visibleFor=0;enemy.telegraph=null;enemy.contacting=false
			for shot in s.shots+s.enemyShots:
				if shot.has("vz"):shot.vz=-shot.vz
			record_event(s,"klein-frame-turn",{"facing":s.facing});s.lastEvent="Klein side join: forward direction reversed on the surface. The camera follows your ship."
		s.campaign.shipMotion=motion.duplicate(true)
		if frame_turned:
			for segment in s.campaign.shipMotion.segments:segment.from.y=880-segment.from.y;segment.to.y=880-segment.to.y
		if not motion.crossings.is_empty():
			s.campaign.wraps+=motion.crossings.size();s.campaign.metrics.seamCrossings+=motion.crossings.size()
			for crossing in motion.crossings:record_event(s,"klein-crossing",{"actor":"player","edge":crossing.edge,"rule":crossing.get("rule","klein" if crossing.edge in ["left","right"] else "periodic"),"fraction":crossing.time,"x":crossing.x,"y":crossing.y})
			C.credit_seam(s,motion.crossings)
		s.thrust=90
	else:s.z=C.arena_z(s,offset);s.thrust=Space.space_distance(old_z,s.z,s.fields)/dt
	C.move_enemies(s,dt,camera_from,facing_from,frame_turned);C.tick_director(s);View.update_readiness(s,dt);s.effects=s.effects.filter(func(effect):return effect.until>s.time);settle_debts(s)
	if s.phase!="running":return
	Ecology.tick(s,input,dt);s.fireClock=maxf(0,s.fireClock-dt)
	if (input.get("fire",false) or hold_prompt=="fire") and s.fireClock<=0:
		s.shots.append({"x":s.x,"z":Space.advance_through_space(s.z,25*s.facing,s.fields),"vx":0,"vz":680*(s.facing if not route else 1),"payload":U.loadout(s).map(func(seed):return seed.type),"owner":"player","geometryRule":"projective" if C.is_projective(s) else "klein" if route else "route"});s.fireClock=.16;var details=s.shots[-1].duplicate();details.actor="player";record_event(s,"player-fire",details)
	var projectile_cache: Dictionary={}
	for shot in s.shots:
		if not shot.get("dead",false):advance_projectile(s,shot,dt,{"x":old_x,"z":old_z},null,{},{},projectile_cache,false)
	for enemy in s.enemies:
		if enemy.hp<=0 or enemy.get("escaped",false) or enemy.stage>s.stage:continue
		var ready: bool = View.ready(s,enemy)
		if ready or _quick_route_weapon(s,enemy):
			tick_enemy_weapon(s,enemy,dt)
		else:
			enemy.telegraph=null
		if not ready:
			enemy.contacting=false
			continue
		var touching=not enemy.get("training",false) and (surface_hit(s,s.campaign.get("shipMotion",{}).get("segments",Boss.still(s,s)),Boss.still(s,enemy),35) if route else segment_near(enemy.x-old_x,Space.space_distance(old_z,enemy.z,s.fields),enemy.x-s.x,Space.space_distance(s.z,enemy.z,s.fields),35))
		if touching and not enemy.get("contacting",false):damage(s,"Ship contact. One hull point lost.",1,false,{"source":"ship","target":enemy.id})
		enemy.contacting=touching
	var old={"x":old_x,"z":old_z};collect_drops(s,old,s.campaign.get("shipMotion",{}).get("segments") if route else null)
	for shot in s.enemyShots:
		if not shot.get("dead",false):advance_projectile(s,shot,dt,old,null,{},{},projectile_cache,false)
	for rock in s.asteroids:
		if rock.hp<=0 or not rock.get("presented",false) or rock.get("wakeUntil",0)>s.time or not View.in_view(s,rock):continue
		var hit=surface_hit(s,s.campaign.get("shipMotion",{}).get("segments",Boss.still(s,s)),Boss.still(s,rock),rock.radius+Fleet.active_ship(s).coreRadius) if route else segment_near(old_x-rock.x,Space.space_distance(rock.z,old_z,s.fields),s.x-rock.x,Space.space_distance(rock.z,s.z,s.fields),rock.radius+18)
		if hit:damage(s,"Asteroid impact. One hull point lost.",1,false,{"source":"asteroid","target":rock.id});break_asteroid(s,rock,"ship")
	s.asteroids=s.asteroids.filter(func(rock):return rock.hp>0 and (not C.is_scrolling(s) or C.arena_y(s,rock.z)>-140))
	s.shots=s.shots.filter(func(shot):return not shot.get("dead",false))
	s.enemyShots=s.enemyShots.filter(func(shot):return not shot.get("dead",false))
	s.drops=s.drops.filter(func(drop):return not drop.get("collected",false) and (C.arena_y(s,drop.z)>-140 if C.is_scrolling(s) else true));C.after_tick(s)
