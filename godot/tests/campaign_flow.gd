extends SceneTree
const Sim=preload("res://scripts/flight_simulation.gd")
const C=preload("res://scripts/campaign.gd")
const View=preload("res://scripts/combat_view.gd")
const Fleet=preload("res://scripts/fleet.gd")
const Ecology=preload("res://scripts/ecology.gd")
var checks=[]
var failures=[]
func check(name: String,condition: bool) -> void:
	checks.append(name)
	if not condition:failures.append(name)
func step(sim,s: Dictionary,input: Dictionary={}) -> void:
	for enemy in s.enemies:
		if View.in_view(s,enemy) and enemy.hp>0 and enemy.stage<=s.stage:enemy.presented=true
	for rock in s.asteroids:
		if View.in_view(s,rock):rock.presented=true
	sim.tick(s,input,1.0/120)
func _initialize() -> void:
	var sim=Sim.new();var s=sim.create_flight({"seed":20261114});s.phase="running"
	for i in range(10):step(sim,s,{"horizontal":-1})
	for i in range(20):step(sim,s,{"horizontal":1})
	check("Level 0 keeps its first combat target",s.campaign.lesson=="engage" and not s.campaign.has("movement") and s.enemies.size()==1 and s.enemies[0].hp==8)
	for i in range(10):step(sim,s,{"horizontal":-1})
	for i in range(900):
		if s.campaign.index==0:break
		var prompt: String=s.campaign.training.prompt
		step(sim,s,{"fire":true,"fold":prompt=="fold","unfold":prompt=="unfold"})
	check("Actual tutorial movement, held fire, fold and unfold reach Level1",s.campaign.index==0 and s.hull>0)
	check("The tutorial keeps one target identity through the fold sequence",s.events.filter(func(e):return e.type=="tutorial-enemy-spawned").size()==1)
	check("Level1 retains normal simulation speed and manual fire",s.phase=="running" and s.chapter.get("number",0)==1)
	for index in range(27):
		if s.campaign.index!=index:sim.enter_chapter(s,index)
		if not C.is_boss(s):
			s.cameraZ=s.chapter.routeLength-.1;s.z=s.cameraZ if not C.is_surface(s) else s.z;s.enemyShots=[];s.debts=[]
			for enemy in s.enemies:enemy.hp=0
			for i in range(3):step(sim,s)
			check("Route "+str(index)+" clears by distance and records one bonus",s.phase=="cleared" and s.events.filter(func(e):return e.type=="speed-bonus" and e.chapter==index).size()==1)
			if index<26:check("Route "+str(index)+" continues to the next existing section",sim.continue_campaign(s) and s.campaign.index==index+1)
			continue
		s.campaign.introRemaining=0;s.enemyShots=[]
		for enemy in s.enemies:sim.hit_enemy(s,enemy,enemy.hp)
		step(sim,s)
		var part_id="klein-relay" if index==8 else "projective-module" if index==17 else "curvature-seed"
		check("Boss "+str(index)+" exposes a physical unbanked reward",s.phase=="running" and s.campaign.bossPhase=="salvage" and s.campaign.repairPart.id==part_id and part_id not in s.fleetProfile.driveParts)
		var target_x=s.campaign.repairPart.x;var collected=false;var banked_early=false
		for i in range(4000):
			if s.phase=="won":break
			var horizontal=clampf((target_x-s.x)/(Fleet.active_ship(s).speed/120),-1,1)
			step(sim,s,{"horizontal":horizontal})
			if s.campaign.bossPhase=="exit" and s.phase=="running":
				collected=true
				if part_id in s.fleetProfile.driveParts:banked_early=true
		check("Boss "+str(index)+" requires physical collection before extraction",collected and not banked_early)
		check("Boss "+str(index)+" banks only after the exit distance",s.phase=="won" and part_id in s.fleetProfile.driveParts and s.events.any(func(e):return e.type=="boss-extracted" and e.part==part_id))
		check("Boss "+str(index)+" grade has no route speed result",C.stage_grade(s,s.chapter).speed==null)
		if index<26:check("Boss "+str(index)+" continues the same campaign into the next Act",sim.continue_campaign(s) and s.campaign.index==index+1)
		else:check("ActIII has a saved finish and no ActIV continuation",s.fleetProfile.curvatureSeed and not sim.continue_campaign(s) and s.campaign.index==26)
	var retry_state=sim.create_flight({"seed":54545});sim.enter_chapter(retry_state,6);var enemies=retry_state.enemies.duplicate(true);retry_state.score+=999;retry_state.time+=20;sim.retry(retry_state)
	var layout_matches=retry_state.enemies.size()==enemies.size()
	for i in range(enemies.size()):
		for key in ["x","z","hp","maxHp","equipped","driftX","driftY","clock"]:layout_matches=layout_matches and retry_state.enemies[i].get(key)==enemies[i].get(key)
	check("Retry retains the original run seed and enemy layout",retry_state.runSeed==54545 and layout_matches)
	var debt=sim.create_flight({"seed":123});sim.enter_chapter(debt,0);debt.enemies=[];debt.invulnerable=0;debt.hull=5
	sim.impact(debt,debt,{"x":debt.x,"z":debt.z,"impactDelay":.8,"damage":2});check("Impact Buffer admits debt without immediate hull loss",debt.hull==5 and debt.debts.size()==1)
	debt.invulnerable=100;debt.time+=.81;sim.settle_debts(debt);check("Stored damage resolves through later protection",debt.hull==3 and debt.debts.is_empty())
	for value in [null,1,"bad",{},["unknown"],{ "bad":true }]:
		var eco=Ecology.create_state({"upgrades":value});check("Ecology rejects invalid upgrade list "+str(value),eco.upgrades.is_empty() and eco.capacity==6)
	for index in [8,17,26]:
		var practice=sim.create_flight({"seed":77});sim.enter_chapter(practice,index);practice.practice=true;practice.campaign.introRemaining=0
		for enemy in practice.enemies:enemy.hp=0
		step(sim,practice);practice.campaign.repairPart.collected=true;practice.campaign.bossPhase="exit";practice.campaign.exit={"remaining":.1,"total":900,"openedAt":practice.time-1}
		var profile_before=practice.fleetProfile.duplicate(true);step(sim,practice)
		check("Practice boss "+str(index)+" retains extraction without a component award",practice.phase=="won" and practice.fleetProfile==profile_before and practice.events.any(func(e):return e.type=="boss-extracted"))
		check("Practice boss "+str(index)+" cannot advance the campaign",not sim.continue_campaign(practice))
	var practice_route=sim.create_flight({"seed":77});sim.enter_chapter(practice_route,9);practice_route.practice=true;practice_route.phase="cleared";check("Practice route cannot advance the campaign",not sim.continue_campaign(practice_route))
	var result={"checks":checks.size(),"passed":checks.size()-failures.size(),"failures":failures,"names":checks,"limits":"Actual model input completes Level0. Route-end and defeated-boss fixtures check continuity, physical collection, extraction and reward gates. They do not establish an ordinary-input full campaign, human understanding, native rendering, or hosted play."}
	var output="res://../reports/godot-port-020/campaign/flow-result.json"
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--output="):output=argument.substr(9)
	var file=FileAccess.open(output,FileAccess.WRITE)
	if file!=null:file.store_string(JSON.stringify(result,"  "));file.close()
	print(JSON.stringify(result));quit(0 if failures.is_empty() else 1)
