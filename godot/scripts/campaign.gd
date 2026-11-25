extends RefCounted
const Data = preload("res://scripts/game_data.gd")
const Space = preload("res://scripts/space_core.gd")
const Edge = preload("res://scripts/edge_core.gd")
const Upgrades = preload("res://scripts/upgrades.gd")
const Fleet = preload("res://scripts/fleet.gd")
const Random = preload("res://scripts/random.gd")
const Waves = preload("res://scripts/waves.gd")
const Ecology = preload("res://scripts/ecology.gd")
const Journey = preload("res://scripts/projectile_journey.gd")
const SCROLL_SPEED = 90.0
const TUTORIAL_FOLDED_SHOTS := 2

static func chapter(s: Dictionary) -> Dictionary:
	return s.get("chapter",{})
static func is_tutorial(s: Dictionary) -> bool:
	return s.get("campaign",{}).get("index",-1)==-1
static func is_boss(s: Dictionary) -> bool:
	return chapter(s).get("kind","")=="boss"
static func is_scrolling(s: Dictionary) -> bool:
	return chapter(s).get("kind","")=="level"
static func is_surface(s: Dictionary) -> bool:
	return is_scrolling(s) and chapter(s).get("kleinSurface",false)
static func is_projective(s: Dictionary) -> bool:
	return chapter(s).get("projectiveSurface",false) or chapter(s).get("projectiveBoss",false)
static func hybrid_active(s: Dictionary) -> bool:
	return chapter(s).get("hybrid",false) and s.campaign.get("hybridPhase",1)>=3 and s.time>=s.campaign.get("hybridJoinReadyAt",s.campaign.get("phaseBreakUntil",0))
static func surface_trace(s: Dictionary,p: Dictionary,dx: float,dy: float) -> Dictionary:
	return Edge.trace_projective_surface(p,dx,dy) if is_projective(s) else Edge.trace_klein(p,dx,dy)
static func arena_y(s: Dictionary,z: float) -> float:
	if is_surface(s): return s.facing*Space.space_distance(s.get("surfaceViewZ",0),z,s.fields)
	return Space.space_distance(0 if is_boss(s) else s.get("cameraZ",0),z,s.fields)
static func arena_z(s: Dictionary,y: float) -> float:
	if is_surface(s): return Space.advance_through_space(s.get("surfaceViewZ",0),s.facing*y,s.fields)
	return Space.advance_through_space(0 if is_boss(s) else s.get("cameraZ",0),y,s.fields)
static func event(s: Dictionary,type: String,details: Dictionary={}) -> void:
	var value={"time":s.time,"type":type};value.merge(details,true);s.events.append(value)
static func pressure_budget(c: Dictionary):
	if c.get("kind","")!="level":return null
	var density=maxf(.5,c.get("carriers",0)/10.0)
	var speed=1.25 if c.get("pressure",false) else 1.05 if c.get("kleinSurface",false) else 1.0
	var overlap=1.35 if c.get("pressure",false) else 1.2 if c.get("lesson","") in ["layer","mastery"] else 1.0
	var targeting=1.25 if c.get("lesson","") in ["global-gap","mastery"] else 1.0
	var geometry=1.0
	if c.get("kleinSurface",false):geometry=1.1 if c.get("lesson","")=="surface" else 1.35 if c.get("lesson","") in ["return","timing"] else 1.5 if c.get("lesson","")=="mastery" else 1.2
	return {"density":density,"speed":speed,"overlap":overlap,"targeting":targeting,"geometry":geometry,"total":snappedf(density*speed*overlap*targeting*geometry,.01)}
static func spatial_credit_window(s: Dictionary) -> String:
	if chapter(s).has("waveScript") and s.campaign.get("currentWave",{}).get("kind","")=="combat":return "wave:"+str(s.campaign.currentWave.id)
	return "segment:"+str(int(clampf(s.cameraZ/maxf(1,chapter(s).get("routeLength",1)),0,.9999)*8))
static func threat_present(s: Dictionary) -> bool:
	if not s.enemyShots.is_empty():return true
	for e in s.enemies:
		if e.hp>0 and e.get("waveActive",true) and e.get("telegraph")!=null:return true
	return false
static func credit_seam(s: Dictionary,crossings: Array) -> bool:
	if not is_surface(s):return false
	var side=false
	for crossing in crossings:side=side or crossing.edge in ["left","right"]
	if not side:return false
	var lesson=chapter(s).get("lesson","")
	if lesson not in ["surface","seam"] and (not threat_present(s) or s.campaign.get("currentWave",{}).get("kind","")=="break"):return false
	if not s.campaign.has("seamCreditWindows"):s.campaign.seamCreditWindows=[]
	var window=spatial_credit_window(s)
	if window in s.campaign.seamCreditWindows:return false
	s.campaign.seamCreditWindows.append(window);s.campaign.metrics.seamEvidence+=1
	event(s,"seam-credit",{"window":window,"lesson":lesson});return true
static func credit_fold(s: Dictionary,automatic: bool=false) -> bool:
	if automatic or not is_surface(s) or chapter(s).get("lesson","") not in ["timing","mastery"] or not threat_present(s) or s.campaign.get("currentWave",{}).get("kind","")=="break":return false
	if not s.campaign.has("foldCreditWindows"):s.campaign.foldCreditWindows=[]
	var window=spatial_credit_window(s)
	if window in s.campaign.foldCreditWindows:return false
	s.campaign.foldCreditWindows.append(window);s.campaign.metrics.foldEvidence+=1;event(s,"fold-credit",{"window":window,"lesson":chapter(s).get("lesson","")});return true
static func grade_letter(score: int) -> String:
	return "S" if score>=92 else "A" if score>=82 else "B" if score>=70 else "C" if score>=55 else "D" if score>=40 else "E"
static func speed_grade(s: Dictionary,c: Dictionary) -> Variant:
	if c.get("kind","")!="level" or c.get("routeLength",0)<=0:return null
	var elapsed=maxf(0,s.time-s.campaign.startedAt);var reference=c.routeLength/SCROLL_SPEED
	var score=int(floor(100*clampf((1-elapsed/reference)/.7,0,1)+.5))
	return {"letter":grade_letter(score),"score":score,"bonus":score*10,"elapsed":elapsed,"reference":reference}
static func stage_grade(s: Dictionary,c: Dictionary) -> Dictionary:
	var m=s.campaign.metrics;var survival=int(floor(40*maxf(0,s.hull)/5+.5));var execution=int(floor(20*minf(1,float(s.campaign.defeated)/maxi(1,s.enemies.size()))+.5));var precision=mini(15,int(floor(m.grazes*2.5+.5)))
	var target=2 if c.get("lesson","") in ["surface","seam"] else 3 if c.get("lesson","") in ["return","global-gap"] else 4 if c.get("lesson","")=="mastery" else 1
	var topology=mini(15,int(floor(15.0*m.seamEvidence/target+.5))) if c.get("kleinSurface",false) else 15
	var control_target=2 if c.get("lesson","") in ["timing","mastery"] else 0
	var control=mini(10,int(floor(10.0*m.foldEvidence/control_target+.5))) if control_target else 10
	var score=clampi(survival+execution+precision+topology+control,0,100)
	return {"letter":grade_letter(score),"score":score,"survival":survival,"execution":execution,"precision":precision,"topology":topology,"control":control,"speed":speed_grade(s,c),"metrics":m.duplicate(true)}
static func issue_kit(s: Dictionary,stage: int) -> void:
	var ids=[0] if stage==0 else Upgrades.roster(stage)
	for type in ids:
		for polarity in [1,-1]:
			var key=str(type)+":"+str(polarity);var found=false
			for seed in s.inventory:
				if seed.key==key:found=true;break
			if not found:
				s.upgradeSerial+=1;s.inventory.append({"key":key,"type":type,"polarity":polarity,"id":Data.get_data().operations[type].key,"source":"training-kit","instance":s.upgradeSerial})
	if Upgrades.loadout(s).is_empty():
		for seed in s.inventory:
			if seed.key=="0:1":s.equipped[0]=seed;break
	s.upgrade=s.equipped[0] if s.equipped[0]!=null else s.equipped[1]
static func spawn_route(s: Dictionary) -> void:
	var c=chapter(s);var pattern=[]
	for row in c.waves:pattern.append_array(row)
	var random=Random.new(int(s.runSeed),int(s.campaign.index));var compiled=Waves.compile_script(c,random);var lanes=[0,-320,320,-160,160,-80,80]
	if compiled!=null:
		for i in range(compiled.enemies.size()):
			var spec=compiled.enemies[i];var type=int(pattern[i%pattern.size()]);var polarity=-1 if i%2 else 1;s.campaign.enemySerial+=1
			var z=420+(c.routeLength-520)*spec.progress*(1-c.get("tailQuiet",0));var role=spec.get("role","pattern-carrier");var base_hp=1 if role=="popcorn" else 3 if role=="anchor" else 6 if role=="miniboss" else 1
			var hp=spec.get("hp",base_hp);var direction=1 if i%2 else -1
			var enemy={"id":s.campaign.enemySerial,"name":spec.get("name",("Scout" if role=="popcorn" else "Anchor" if role=="anchor" else "Miniboss" if role=="miniboss" else "Carrier")+" "+str(i+1)),"x":spec.lane,"z":z,"routeDepth":z,"hp":hp,"maxHp":hp,"role":role,"waveId":spec.waveId,"waveLabel":spec.waveLabel,"waveKind":spec.waveKind,"waveActive":false,"activationAt":spec.activationAt,"attackDelay":spec.attackDelay,"clock":spec.attackDelay,"firePeriod":spec.get("firePeriod",2.8 if role=="popcorn" else 1.55 if role=="anchor" else 1.2 if role=="miniboss" else 1.35 if c.get("pressure",false) else 1.85)+i%3*.08,"shotSpeed":spec.get("shotSpeed",175 if c.get("pressure",false) else 150),"stage":c.stage,"introduction":spec.get("introduction",minf(1,.4+i/9.0)),"patternRole":spec.get("pattern","fan"),"patternCycle":0,"patternConfig":spec.get("patternConfig"),"patternSequence":spec.get("patternSequence"),"geometryRule":spec.get("geometryRule","projective" if c.get("projectiveSurface",false) else "klein"),"linkGroup":spec.get("linkGroup"),"equipped":[{"type":type,"polarity":polarity,"key":str(type)+":"+str(polarity)},{"type":(type+3)%7,"polarity":polarity,"key":str((type+3)%7)+":"+str(polarity)}],"dropsUpgrade":spec.get("dropsUpgrade",true),"driftX":spec.get("driftX",direction*(70 if role=="popcorn" else 45) if c.get("moving",false) else 0),"driftY":spec.get("driftY",direction*(42 if role=="popcorn" else 30) if c.get("moving",false) else 0),"facing":-1,"presented":false,"visibleFor":0}
			s.enemies.append(enemy)
		s.campaign.wavePlan=compiled.waves;s.campaign.waveIndex=-1;s.campaign.scriptedFolds=compiled.scriptedFolds;s.campaign.scriptedFoldIndex=0;s.campaign.lessonNotices=compiled.notices
	else:
		for i in range(int(c.carriers)):
			var type=int(pattern[i%pattern.size()]);var polarity=-1 if i%2 else 1;s.campaign.enemySerial+=1
			var lane=0.0
			if c.get("calm",false):lane=-320 if i==1 else 320 if i==2 else random.next_float()*400-200
			else:lane=c.get("lanePlan",[])[i] if i<c.get("lanePlan",[]).size() else lanes[i%lanes.size()]
			var x=0.0 if i==0 and not c.get("calm",false) else clampf(lane+(random.next_float()-.5)*(12 if abs(lane)>300 else 60),-330,330)
			var first=1450 if c.get("number",0)==1 else 650 if c.get("klein",false) else 450
			var progress=float(i)/maxi(1,int(c.carriers)-1);var ramp=minf(1,i/8.0) if c.get("klein",false) else 0.0;var authored=progress
			if not c.get("breaks",[]).is_empty():
				var segments=[];var start=0.0;var total=0.0
				for center in c.breaks:
					var a=maxf(start,center-.035);var b=minf(1,center+.035)
					if a>start:segments.append([start,a]);total+=a-start
					start=b
				if start<1:segments.append([start,1]);total+=1-start
				var target=progress*total;var cursor=0.0
				for segment in segments:
					var length=segment[1]-segment[0]
					if target<=cursor+length:authored=segment[0]+target-cursor;break
					cursor+=length
			var z=650+i*(c.routeLength-900)/maxf(1,c.carriers-1)+(random.next_float()-.5)*80 if c.get("calm",false) else first+(c.routeLength-first-80)*(pow(progress,.55) if c.get("klein",false) else authored*(1-c.get("tailQuiet",0)))+(0 if i==0 else (random.next_float()-.5)*30)
			var hp=1 if c.get("calm",false) or c.get("klein",false) else (2 if c.get("pressure",false) else 1) if c.get("kleinSurface",false) else 2;var direction=1 if i%2 else -1
			var role="carrier"
			if c.get("kleinSurface",false):role="miniboss" if i==c.carriers-1 and c.get("actStage",0)>=5 else "anchor" if c.get("actStage",0)>=5 and i>2 and i%6==0 else "popcorn" if i%4==0 else "pattern-carrier"
			var role_hp=5 if role=="miniboss" else 3 if role=="anchor" else hp
			var enemy={"id":s.campaign.enemySerial,"x":x,"z":z,"hp":role_hp,"maxHp":role_hp,"role":role,"clock":1.8-1.2*ramp+i%3*.15 if c.get("klein",false) else 2.8+random.next_float() if c.get("calm",false) else 1.4+i%3*.3,"firePeriod":2.3-1.4*ramp+i%3*.1 if c.get("klein",false) else (2.8 if role=="popcorn" else 1.55 if role=="anchor" else 1.2 if role=="miniboss" else 1.35 if c.get("pressure",false) else 1.85)+i%3*.12 if c.get("kleinSurface",false) else 3.8+random.next_float() if c.get("calm",false) else 2.3+i%3*.2,"shotSpeed":145+65*ramp if c.get("klein",false) else (175 if c.get("pressure",false) else 150) if c.get("kleinSurface",false) else 145,"stage":c.stage,"introduction":minf(1,.35+i/8.0) if c.get("kleinSurface",false) else ramp,"equipped":[{"type":type,"polarity":polarity,"key":str(type)+":"+str(polarity)}],"dropsUpgrade":true,"driftX":direction*(45+105*ramp) if c.get("klein",false) else direction*45 if c.get("moving",false) else 0,"driftY":direction*(35+105*ramp) if c.get("klein",false) else direction*30 if c.get("moving",false) else 0,"facing":-1,"presented":false,"visibleFor":0}
			if c.stage==2:enemy.equipped.append({"type":(type+3)%7,"polarity":polarity,"key":str((type+3)%7)+":"+str(polarity)})
			if c.get("kleinSurface",false):enemy.routeDepth=z
			if c.get("klein",false) or c.get("kleinSurface",false):enemy.patternRole="cycle" if role=="miniboss" else c.get("patternPlan",[])[i] if i<c.get("patternPlan",[]).size() else "fan" if i<3 else "sweep" if i<6 else "gap";enemy.patternCycle=0
			s.enemies.append(enemy)
		s.campaign.lessonNotices=c.get("lessonNotices")
	for i in range(int(c.get("asteroids",0))):
		var x=-326 if i%7==3 else 326 if i%7==6 else random.next_float()*520-260
		var z=350+i*(c.routeLength-550)/maxf(1,c.asteroids-1)+(random.next_float()-.5)*50;var radius=20+random.next_float()*10
		for enemy in s.enemies:
			if abs(enemy.z-z)<110 and abs(enemy.x-x)<90:x=-220 if x>0 else 220;break
		s.asteroids.append({"id":"rock-"+str(i),"x":x,"z":z,"radius":radius,"hp":2,"maxHp":2,"shape":int(random.next_float()*10000),"rotation":random.next_float()*TAU,"presented":false})
	s.campaign.pressureBudget=pressure_budget(c);s.campaign.routeLength=c.routeLength;s.campaign.lessonNoticeIndex=-1
	event(s,"route-start",{"chapter":s.campaign.index,"length":c.routeLength,"carriers":s.enemies.size(),"pressure":s.campaign.pressureBudget})
static func enter(s: Dictionary,index: int) -> void:
	Journey.end_all(s,"scene-exit")
	var serial=s.get("campaign",{}).get("enemySerial",0);var previous=s.get("projective")
	s.campaign={"index":index,"defeated":0,"asteroidsBroken":0,"enemySerial":serial,"startedAt":s.time,"wraps":0,"routeReached":false,"scrollDistance":0,"metrics":{"grazes":0,"seamCrossings":0,"seamEvidence":0,"folds":0,"unfolds":0,"foldEvidence":0,"damage":0,"kills":0,"wavesCleared":0}}
	var data=Data.get_data();s.chapter=(data.tutorial if index==-1 else data.chapters[index]).duplicate(true);var c=chapter(s)
	s.stage=c.stage;s.slotCount=2 if c.stage==2 else 1;s.projective=Ecology.create_state(previous if previous!=null else {}) if c.get("act",0)==3 else null
	for key in ["x","z","cameraZ","surfaceViewZ","thrust","lateralVelocity","invulnerable","fireClock"]:s[key]=0.0
	s.facing=1;s.hull=5
	for key in ["fields","shots","enemyShots","asteroids","debts","effects","drops","gates","enemies"]:s[key]=[]
	var random=Random.new(int(s.runSeed)^0x4b1e1,index*101)
	s.drive={"status":"damaged","warningUntil":null,"nextFaultAt":s.time+(6 if c.get("number",0)==1 else 10)+random.next_float()*3,"faults":0,"attempts":0};s.nextEnemyWindup=0
	if c.kind!="tutorial":issue_kit(s,int(c.stage))
	s.phase="running";s.lastEvent=c.name+". "+c.goal
	if c.kind=="tutorial":
		c.name="First contact"
		c.goal="Clear the first contact to enter the route."
		c.hint="Left / Right steer. Hold Space to fire. Left Shift folds; Right Shift unfolds. Both sides’ shots accelerate in folded space."
		s.campaign.lesson="engage"
		s.campaign.training={"shot":false,"folded":false,"unfolded":false,"enemySpawned":true,"completeAt":null,
			"guided":true,"prompt":"","holdPrompt":"","dodgeStep":0,"dodgeShot":"","shiftStep":0,"foldedShots":0,"attackStarted":false}
		s.campaign.enemySerial+=1
		s.enemies=[{"id":s.campaign.enemySerial,"name":"Training enemy","training":true,"x":0,"z":s.z+450,"hp":8,"maxHp":8,"clock":.25,"firePeriod":1.4,"shotSpeed":145,"stage":0,"equipped":[],"driftX":0,"driftY":0,"facing":-1,"dropsUpgrade":false,"presented":false,"visibleFor":0}]
		s.lastEvent=c.name+". "+c.goal
		event(s,"tutorial-enemy-spawned",{"target":s.enemies[0].id})
	elif c.kind=="boss":spawn_boss(s)
	else:
		if c.get("number",0)==1:s.campaign.lesson="fold";s.campaign.spaceLesson={"folded":false,"unfolded":false,"lastDepth":0}
		spawn_route(s)
		if c.get("number",0)==1:update_space_lesson(s)
	event(s,"chapter-start",{"chapter":index,"kind":c.kind,"name":c.name})
	s.campaign.checkpoint={}
	for key in ["inventory","equipped","score","kills","foldBonus","foldsUsed","time","upgradeSerial","projective"]:s.campaign.checkpoint[key]=s[key].duplicate(true) if s[key] is Array or s[key] is Dictionary else s[key]
static func spawn_boss(s: Dictionary) -> void:
	var c=chapter(s);s.campaign.bossPhase="combat";s.campaign.introRemaining=4.0;s.campaign.announcement={"text":c.intro,"until":s.time+8};s.lastEvent=c.intro
	if c.get("hybrid",false):s.campaign.hybridPhase=1
	if c.get("projectiveBoss",false):s.campaign.curvaturePhase=1
	var definitions=[{"name":"Core","hp":44,"x":0,"y":650,"vx":135,"vy":-90,"type":6},{"name":"Escort A","hp":18,"x":-250,"y":370,"vx":-220,"vy":150,"type":1},{"name":"Escort B","hp":18,"x":250,"y":780,"vx":205,"vy":170,"type":3}]
	if c.get("hybrid",false):definitions=[{"name":"Projective Core","hp":46,"x":0,"y":650,"vx":145,"vy":-95,"type":6,"geometryRule":"klein","sequence":["fan","gap","sweep"]},{"name":"Klein Anchor","hp":18,"x":-250,"y":370,"vx":-220,"vy":155,"type":1,"geometryRule":"klein","sequence":["fan","wall","return"]},{"name":"Antipodal Anchor","hp":18,"x":250,"y":780,"vx":210,"vy":175,"type":3,"geometryRule":"projective","projective":true,"sequence":["sweep","aimed","return"]}]
	if c.get("projectiveBoss",false):definitions=[{"name":"Curvature Core","hp":55,"x":0,"y":650,"vx":145,"vy":-105,"type":6,"geometryRule":"projective","sequence":["fan","return","gap","spiral"]},{"name":"Arc Left","hp":22,"x":-250,"y":370,"vx":-215,"vy":145,"type":1,"geometryRule":"projective","sequence":["fan","wall","crossfire"]},{"name":"Arc Right","hp":22,"x":250,"y":780,"vx":210,"vy":160,"type":3,"geometryRule":"projective","sequence":["sweep","aimed","return"]}]
	for i in range(definitions.size()):
		var e=definitions[i];s.campaign.enemySerial+=1;var polarity=-1 if i%2 else 1
		s.enemies.append({"id":s.campaign.enemySerial,"name":e.name,"x":e.x,"z":arena_z(s,e.y),"hp":e.hp,"maxHp":e.hp,"clock":1+i*.5,"stage":2,"boss":true,"driftX":e.vx,"driftY":e.vy,"facing":-1,"geometryRule":e.get("geometryRule","klein"),"projective":e.get("projective",false),"patternRole":"cycle" if c.get("hybrid",false) or c.get("projectiveBoss",false) or i==0 else "fan" if i==1 else "sweep","patternSequence":e.get("sequence"),"patternCycle":0,"patternConfig":{"count":4 if i==0 else 3,"beats":2,"recovery":1.35 if i==0 else 1.75} if c.get("hybrid",false) or c.get("projectiveBoss",false) else null,"equipped":[{"type":e.type,"polarity":polarity},{"type":(int(e.type)+3)%7,"polarity":polarity}],"dropsUpgrade":true,"presented":false,"visibleFor":0})
static func tutorial_guided(s: Dictionary) -> bool:
	return is_tutorial(s) and s.get("campaign",{}).get("training",{}).get("guided",false)

static func skip_tutorial_guidance(s: Dictionary) -> void:
	if tutorial_guided(s):
		s.campaign.training.guided=false
		s.campaign.training.prompt="skipped"
		s.campaign.training.holdPrompt=""

static func tutorial_hold_prompt(s: Dictionary) -> String:
	return s.campaign.training.holdPrompt if tutorial_guided(s) else ""

static func tutorial_keeps_target(s: Dictionary,enemy: Dictionary) -> bool:
	return enemy.get("training",false) and tutorial_guided(s) and s.campaign.training.shiftStep==1

static func resume_tutorial(s: Dictionary) -> void:
	var training: Dictionary=s.campaign.training
	var prompt: String=training.holdPrompt
	training.holdPrompt=""
	if prompt=="fire":
		training.attackStarted=true
	event(s,"tutorial-resume",{"prompt":prompt})

static func tutorial_weapon_allowed(s: Dictionary) -> bool:
	if not tutorial_guided(s):
		return true
	var training: Dictionary=s.campaign.training
	return training.dodgeShot.is_empty() if training.dodgeStep<2 else training.attackStarted

static func tutorial_enemy_fire(s: Dictionary,details: Dictionary) -> void:
	if tutorial_guided(s) and s.campaign.training.dodgeStep<2:
		s.campaign.training.dodgeShot=details.objectId
		s.campaign.training.dodgeAim=details.aimX

static func tutorial_prompt(s: Dictionary,value: String,details: Dictionary={}) -> void:
	var training: Dictionary=s.campaign.training
	if training.prompt==value:
		return
	training.prompt=value
	var hold: bool=value in ["dodge-left","dodge-right","fold","unfold"] or (value=="fire" and not training.attackStarted)
	training.holdPrompt=value if hold else ""
	if not value.is_empty():
		var evidence={"prompt":value}
		evidence.merge(details)
		event(s,"tutorial-prompt",evidence)

static func tutorial_action(s: Dictionary,type: String) -> bool:
	if not is_tutorial(s) or s.phase!="running":return false
	if s.campaign.lesson=="complete":return false
	var training=s.campaign.training
	if training.guided:
		if type=="fold" and training.prompt=="fold":
			training.shiftStep=1
			tutorial_prompt(s,"folded")
		elif type=="unfold" and training.prompt=="unfold":
			training.shiftStep=2
			tutorial_prompt(s,"finish")
		elif type=="player-fire" and training.shiftStep==1 and not s.fields.is_empty():
			training.foldedShots=mini(TUTORIAL_FOLDED_SHOTS,training.foldedShots+1)
	if type=="player-fire" and not training.shot:training.shot=true;s.lastEvent="Keep firing. Left Shift folds distance for both sides.";event(s,"tutorial-shot-complete");return true
	if type=="fold" and not training.folded:training.folded=true;s.lastEvent="Shots arrive faster. Right Shift unfolds.";event(s,"tutorial-fold-complete");return true
	if type=="unfold" and training.folded and not training.unfolded and s.fields.is_empty():training.unfolded=true;s.lastEvent="Space is open. Clear the first contact to enter the route.";event(s,"tutorial-unfold-complete");return true
	return false

static func update_tutorial_guidance(s: Dictionary) -> void:
	if not tutorial_guided(s) or s.campaign.lesson=="complete" or s.enemies.is_empty():
		return
	var training: Dictionary=s.campaign.training
	var enemy: Dictionary=s.enemies[0]
	if enemy.hp<=0:
		return
	var health: float=float(enemy.hp)/float(enemy.maxHp)
	if training.shiftStep==0 and health<=0.5:
		training.dodgeStep=2
		training.attackStarted=true
		if s.fields.is_empty():
			tutorial_prompt(s,"fold",{"hp":enemy.hp})
			return
		training.shiftStep=1
		tutorial_prompt(s,"folded",{"hp":enemy.hp})
	if training.shiftStep==1:
		if s.fields.is_empty():
			if training.foldedShots<TUTORIAL_FOLDED_SHOTS:
				tutorial_prompt(s,"fold",{"hp":enemy.hp})
			else:
				training.shiftStep=2
				tutorial_prompt(s,"finish",{"hp":enemy.hp})
		elif training.foldedShots>=TUTORIAL_FOLDED_SHOTS and health<=0.25:
			var shot_index: int=s.enemyShots.find_custom(func(shot):return Space.fold_depth_at(shot.z,s.fields)>0)
			training.promptShot=s.enemyShots[shot_index].objectId if shot_index>=0 else ""
			tutorial_prompt(s,"unfold",{"hp":enemy.hp,"shot":training.promptShot})
		return
	if training.shiftStep>0:
		return
	if training.dodgeStep>=2:
		tutorial_prompt(s,"fire" if absf(s.x-enemy.x)<=24.0 else "line-up")
		return
	if training.dodgeShot.is_empty():
		return
	var shot_index: int=s.enemyShots.find_custom(func(shot):return shot.get("objectId","")==training.dodgeShot)
	var left: bool=training.dodgeStep==0
	var direction: float=-1.0 if left else 1.0
	var prompt: String="dodge-left" if left else "dodge-right"
	if shot_index>=0:
		var shot: Dictionary=s.enemyShots[shot_index]
		var distance: float=Space.space_distance(s.z,shot.z,s.fields)
		if distance>0:
			var cue_distance: float=360.0 if left else minf(205.0,training.get("promptDistance",360.0)-20.0)
			if training.prompt!=prompt and distance<=cue_distance:
				training.promptDistance=distance
				training.promptShot=training.dodgeShot
				tutorial_prompt(s,prompt,{"distance":distance,"shot":training.dodgeShot})
				return
			if training.prompt!=prompt or direction*(s.x-training.dodgeAim)<52.0:
				return
	training.dodgeStep+=1
	training.dodgeShot=""
	enemy.clock=0.15
	if left:
		tutorial_prompt(s,"")
	else:
		tutorial_prompt(s,"fire" if absf(s.x-enemy.x)<=24.0 else "line-up")
static func update_space_lesson(s: Dictionary) -> void:
	if not is_scrolling(s) or chapter(s).get("number",0)!=1:return
	var lesson=s.campaign.spaceLesson;var depth=s.fields.size();var previous=s.campaign.lesson
	if depth>lesson.lastDepth:lesson.folded=true
	if depth<lesson.lastDepth and lesson.folded:lesson.unfolded=true
	lesson.lastDepth=depth;s.campaign.lesson="engage" if s.z>=900 else "ready" if lesson.unfolded else "unfold" if lesson.folded or s.z>=320 else "fold"
	var hints={"fold":"Left Shift shortens the route. Keep firing.","unfold":"Faster exit, faster enemy shots. Right Shift opens space." if depth else "Fold to reach the exit faster. Keep firing.","ready":"Fold for speed. Unfold for reaction time. Keep firing.","engage":"Fold for speed. Unfold for reaction time. Steer out of the locked lane."}
	s.campaign.hint=hints[s.campaign.lesson]
	if previous!=s.campaign.lesson:event(s,"space-lesson",{"lesson":s.campaign.lesson,"x":s.x,"z":s.z});s.lastEvent=s.campaign.hint
static func tick_director(s: Dictionary) -> void:
	if not is_scrolling(s) or Waves.script_for(chapter(s))==null:return
	var c=chapter(s);var progress=clampf(s.cameraZ/maxf(1,c.routeLength),0,1)
	for enemy in s.enemies:
		if enemy.get("waveActive",true) or progress+1e-9<enemy.activationAt:continue
		enemy.waveActive=true;enemy.clock=enemy.get("attackDelay",.2);event(s,"wave-enemy-activated",{"wave":enemy.waveId,"target":enemy.id})
	var plan=s.campaign.get("wavePlan",[]);var index=-1
	for i in range(plan.size()):
		if progress+1e-9>=plan[i].at:index=i
	if index!=s.campaign.get("waveIndex",-1):
		s.campaign.waveIndex=index
		if index>=0:
			var current=plan[index];s.campaign.currentWave=current;event(s,"wave-break" if current.kind=="break" else "wave-start",{"wave":current.id,"label":current.label,"progress":progress})
			if current.kind=="break":
				if current.clearHostile:
					var cleared=s.enemyShots.size();Journey.end_all(s,"recovery-clear","enemy");s.enemyShots=[]
					for enemy in s.enemies:
						if enemy.get("waveActive",true):enemy.telegraph=null;enemy.clock=maxf(.5,enemy.get("clock",0))
					event(s,"recovery-clear",{"wave":current.id,"cleared":cleared})
				s.lastEvent="Recovery: "+current.label+"."
				if c.get("act",0)==3:Ecology.queue_evolution(s,str(current.id))
	if not s.campaign.has("clearedWaves"):s.campaign.clearedWaves=[]
	for wave in plan:
		if wave.kind=="break" or wave.id in s.campaign.clearedWaves or progress<wave.at:continue
		var members=s.enemies.filter(func(e):return e.get("waveId")==wave.id)
		if not members.is_empty() and members.all(func(e):return e.hp<=0 or e.get("escaped",false)):
			s.campaign.clearedWaves.append(wave.id);s.campaign.metrics.wavesCleared+=1;event(s,"wave-cleared",{"wave":wave.id,"label":wave.label})
	var folds=s.campaign.get("scriptedFolds",[])
	while s.campaign.get("scriptedFoldIndex",0)<folds.size() and progress+1e-9>=folds[s.campaign.scriptedFoldIndex].at:
		var fold_event=folds[s.campaign.scriptedFoldIndex];s.campaign.scriptedFoldIndex+=1
		if fold_event.action=="add" and Space.add_fold(s):
			s.fields[-1].source="authored-lesson";s.fields[-1].label=fold_event.label;event(s,"fold",{"fields":s.fields.size(),"automatic":true,"authored":true});event(s,"timing-fold",{"label":fold_event.label,"fields":s.fields.size()});s.lastEvent=fold_event.label+": space folded. Keep it or use Right Shift to restore the earlier timing."
static func after_tick(s: Dictionary) -> void:
	if s.phase!="running" or is_boss(s):return
	if is_tutorial(s):
		update_tutorial_guidance(s)
		if s.campaign.lesson!="complete" and s.campaign.training.enemySpawned and s.campaign.defeated>0:s.campaign.lesson="complete";s.campaign.training.completeAt=s.time;Journey.end_all(s,"route-exit");s.shots=[];s.enemyShots=[];s.lastEvent="Training complete. Level 1 beginning.";event(s,"tutorial-complete")
		if s.campaign.lesson=="complete" and s.time-s.campaign.training.completeAt>=1.05:enter(s,0);s.campaign.autoFromTutorial=true;s.campaign.announcement={"text":"LEVEL 1 · TWO SIDES","until":s.time+2.2}
		return
	update_space_lesson(s)
	if not s.campaign.routeReached and s.cameraZ>=chapter(s).routeLength:s.campaign.routeReached=true;event(s,"route-end",{"chapter":s.campaign.index,"distance":s.cameraZ})
	if not s.campaign.routeReached or s.debts.any(func(d):return str(d.target)=="player"):return
	Journey.end_all(s,"route-exit")
	s.campaign.grade=stage_grade(s,chapter(s));var speed=s.campaign.grade.speed;s.score+=speed.bonus
	var details=speed.duplicate(true);details.chapter=s.campaign.index;event(s,"speed-bonus",details)
	s.phase="cleared";s.lastEvent=chapter(s).name+" route complete · Speed "+speed.letter+" · +"+str(speed.bonus)+".";event(s,"chapter-cleared",{"chapter":s.campaign.index,"grade":s.campaign.grade})
static func reset_entry(s: Dictionary,enemy: Dictionary,edge: String,klein: bool=false) -> void:
	enemy.presented=false;enemy.visibleFor=0;enemy.escaped=false;enemy.telegraph=null;enemy.contacting=false;enemy.loopCount=enemy.get("loopCount",0)+1
	for shot in s.shots+s.enemyShots:
		if shot.has("gates"):shot.gates.erase("enemy-"+str(enemy.id))
	s.campaign.wraps+=1;event(s,"klein-crossing" if klein else "enemy-return",{"actor":"enemy-"+str(enemy.id),"target":enemy.id,"edge":edge,"x":enemy.x,"z":enemy.z,"hp":enemy.hp})
static func move_enemies(s: Dictionary,dt: float,camera_from: float,old_facing: int=1,frame_turned: bool=false) -> void:
	for enemy in s.enemies:
		if enemy.hp<=0 or enemy.get("escaped",false):continue
		if is_surface(s):
			if frame_turned and not enemy.get("routeActive",false) and enemy.has("routeDepth"):enemy.z=arena_z(s,enemy.routeDepth-s.cameraZ)
			if not enemy.get("waveActive",true) and not enemy.get("routeActive",false):continue
			var current_y=arena_y(s,enemy.z);var old_y=(880-old_facing*Space.space_distance(camera_from,enemy.z,s.fields) if enemy.get("routeActive",false) else current_y+SCROLL_SPEED*dt) if frame_turned else old_facing*Space.space_distance(camera_from,enemy.z,s.fields)
			if not enemy.get("routeActive",false) and current_y>950:continue
			var start_y=old_y if enemy.get("routeActive",false) else minf(old_y,950);enemy.routeActive=true
			var motion=surface_trace(s,{"x":enemy.x,"y":start_y},enemy.get("driftX",0)*dt,current_y-start_y+enemy.get("driftY",0)*dt)
			enemy.x=motion.x;enemy.z=arena_z(s,motion.y);enemy.facing=(1 if arena_y(s,s.z)>motion.y else -1)*s.facing
			if int(motion.twists)%2:enemy.driftY*=-1;enemy.facing*=-1
			if is_projective(s) and int(motion.get("projectiveCrossings",0))%2:enemy.driftX*=-1
			for crossing in motion.crossings:reset_entry(s,enemy,crossing.edge,true)
			continue
		enemy.facing=1 if s.z>enemy.z else -1
		if chapter(s).get("klein",false):
			var old_y=Space.space_distance(camera_from,enemy.z,s.fields);var current_y=arena_y(s,enemy.z)
			if not enemy.get("routeActive",false) and current_y>950:continue
			var start_y=old_y if enemy.get("routeActive",false) else minf(old_y,950);enemy.routeActive=true
			var motion=Edge.trace_klein({"x":enemy.x,"y":start_y},enemy.get("driftX",0)*dt,current_y-start_y+enemy.get("driftY",0)*dt)
			enemy.x=motion.x;enemy.z=arena_z(s,motion.y)
			if int(motion.twists)%2:enemy.driftY*=-1;enemy.facing*=-1
			for crossing in motion.crossings:reset_entry(s,enemy,crossing.edge,true)
			continue
		enemy.x+=enemy.get("driftX",0)*dt
		if abs(enemy.x)>330:enemy.x=sign(enemy.x)*330;enemy.driftX*=-1
		enemy.z=Space.advance_through_space(enemy.z,enemy.get("driftY",0)*dt,s.fields)
		var y=arena_y(s,enemy.z)
		if is_scrolling(s) and y< -120:enemy.z=arena_z(s,-120+fposmod(y+120,1070));reset_entry(s,enemy,"bottom")
