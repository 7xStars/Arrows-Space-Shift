extends SceneTree

const Sim=preload("res://scripts/flight_simulation.gd")
const C=preload("res://scripts/campaign.gd")
const View=preload("res://scripts/combat_view.gd")
const Space=preload("res://scripts/space_core.gd")
const Store=preload("res://scripts/save_store.gd")
const Data=preload("res://scripts/game_data.gd")
var checks: Array=[]
var failures: Array=[]

func check(name: String,condition: bool) -> void:
	checks.append({"name":name,"result":"Passed" if condition else "Failed"})
	if not condition:failures.append(name)

func start(sim) -> Dictionary:
	var s: Dictionary=sim.create_flight({"seed":35035});s.phase="running";return s

func step(sim,s: Dictionary,input: Dictionary={}) -> void:
	for enemy in s.enemies:
		if View.in_view(s,enemy):enemy.presented=true
	sim.tick(s,input,1.0/120.0)

func pair(s: Dictionary,prefix: String) -> void:
	s.shots=[{"objectId":prefix+":player","owner":"player","x":0,"z":100,"vx":0,"vz":680,"payload":[]}]
	s.enemyShots=[{"objectId":prefix+":enemy","owner":"enemy","x":20,"z":200,"vx":0,"vz":-145,"payload":[]}]

func ended(s: Dictionary) -> Array:
	return s.events.filter(func(e):return e.type=="projectile-ended")

func reach_prompt(sim,s: Dictionary,prompt: String,input: Dictionary={}) -> bool:
	for frame in range(900):
		if s.campaign.get("training",{}).get("prompt","")==prompt:
			return true
		step(sim,s,input)
	return false

func compare_shot_motion(sim,s: Dictionary,input: Dictionary,owner: String,expected_gain: float) -> bool:
	var changed: Dictionary=s.duplicate(true)
	var reference: Dictionary=s.duplicate(true)
	step(sim,changed,input)
	C.skip_tutorial_guidance(reference)
	step(sim,reference)
	for shot in s[owner]:
		var reference_index: int=reference[owner].find_custom(func(item):return item.objectId==shot.objectId)
		var changed_index: int=changed[owner].find_custom(func(item):return item.objectId==shot.objectId)
		if reference_index<0 or changed_index<0:
			continue
		var reference_distance: float=absf(Space.space_distance(shot.z,reference[owner][reference_index].z,reference.fields))
		var changed_distance: float=absf(Space.space_distance(shot.z,changed[owner][changed_index].z,changed.fields))
		if reference_distance>0 and is_equal_approx(changed_distance/reference_distance,expected_gain):
			return true
	return false

func check_guidance(sim) -> void:
	var s=start(sim)
	check("The first live shot gives a left prompt",reach_prompt(sim,s,"dodge-left"))
	var first_distance: float=s.campaign.training.get("promptDistance",0.0)
	var first_shot: String=s.campaign.training.get("promptShot","")
	check("The left cue points to an approaching projectile",
		s.enemyShots.any(func(shot):return shot.objectId==first_shot) and first_distance>350)
	var held_time: float=s.time
	var start_x: float=s.x
	step(sim,s,{"horizontal":-1,"rightPressed":true,"fire":true,"firePressed":true})
	check("The first dodge holds until a fresh Left Arrow press",s.time==held_time and s.x==start_x and s.campaign.training.holdPrompt=="dodge-left")
	step(sim,s,{"leftPressed":true})
	check("Left Arrow steers and resumes on the first step",s.x<start_x and s.time>held_time and s.campaign.training.holdPrompt=="")
	for frame in range(20):
		step(sim,s,{"horizontal":-1})
	check("A different live shot gives a closer right prompt",reach_prompt(sim,s,"dodge-right")
		and s.campaign.training.get("promptShot","")!=first_shot
		and s.campaign.training.get("promptDistance",0.0)<first_distance)
	held_time=s.time
	start_x=s.x
	step(sim,s,{"horizontal":1,"leftPressed":true,"firePressed":true,"fold":true})
	check("The second dodge holds until a fresh Right Arrow press",s.time==held_time and s.x==start_x and s.fields.is_empty())
	step(sim,s,{"rightPressed":true})
	check("Right Arrow steers and resumes on the first step",s.x>start_x and s.time>held_time and s.campaign.training.holdPrompt=="")
	check("Right steering aligns the ship to fire",reach_prompt(sim,s,"fire",{"horizontal":1}) and absf(s.x)<=24)
	held_time=s.time
	step(sim,s,{"fire":true,"fold":true})
	check("Held Space cannot dismiss the fire prompt",s.time==held_time and s.fields.is_empty() and s.campaign.training.holdPrompt=="fire")
	step(sim,s,{"firePressed":true})
	check("Space fires and resumes on the first step",s.time>held_time and s.campaign.training.holdPrompt=="" and s.shots.size()==1)
	check("Held Space stops at half enemy hull",reach_prompt(sim,s,"fold",{"fire":true}) and s.enemies[0].hp==4)
	held_time=s.time
	for frame in range(30):
		step(sim,s,{"fire":true,"unfold":true})
	check("The first hold preserves hull and time until Left Shift",s.enemies[0].hp==4 and s.time==held_time and s.fields.is_empty())
	check("Left Shift doubles chart speed for a live player shot in the fold",compare_shot_motion(sim,s,{"fold":true},"shots",2.0))
	step(sim,s,{"fold":true})
	check("Left Shift adds a real fold and resumes on the first step",s.campaign.training.prompt=="folded" and s.fields.size()==1 and s.time>held_time)
	var waiting: Dictionary=s.duplicate(true)
	for frame in range(36):
		step(sim,waiting)
	check("Earlier shots can reach a quarter hull without starting the unfold prompt",waiting.enemies[0].hp==2
		and waiting.campaign.training.foldedShots==0 and waiting.campaign.training.holdPrompt=="")
	sim.hit_enemy(waiting,waiting.enemies[0],4)
	check("The exercise keeps the target alive at one-quarter hull",waiting.enemies[0].hp==2 and waiting.campaign.defeated==0)
	var skipped: Dictionary=waiting.duplicate(true)
	C.skip_tutorial_guidance(skipped)
	sim.hit_enemy(skipped,skipped.enemies[0],2)
	check("Skip releases the exercise hull limit",skipped.enemies[0].hp==0 and skipped.campaign.defeated==1)
	for frame in range(90):
		step(sim,s,{"fire":true})
		if s.campaign.training.foldedShots==1:
			break
	check("One new shot leaves the exercise active",s.campaign.training.foldedShots==1 and s.campaign.training.holdPrompt=="")
	var restore: Dictionary=s.duplicate(true)
	step(sim,restore,{"unfold":true})
	check("An early unfold asks the player to restore the fold",restore.fields.is_empty() and restore.campaign.training.holdPrompt=="fold"
		and restore.campaign.training.foldedShots==1)
	step(sim,restore,{"fold":true})
	check("Restoring the fold keeps progress and resumes flight",restore.fields.size()==1 and restore.campaign.training.holdPrompt==""
		and restore.campaign.training.foldedShots==1)
	var already_fired: Dictionary=restore.duplicate(true)
	already_fired.campaign.training.foldedShots=2
	already_fired.enemies[0].hp=3
	step(sim,already_fired,{"unfold":true})
	check("An early unfold after two shots completes the fold exercise",already_fired.fields.is_empty()
		and already_fired.campaign.training.prompt=="finish" and already_fired.campaign.training.shiftStep==2)
	check("Held Space stops at one-quarter enemy hull",reach_prompt(sim,s,"unfold",{"fire":true}) and s.enemies[0].hp==2)
	check("Unfold waits for two new player shots",s.campaign.training.foldedShots==2)
	var hostile_ids: Array=s.enemyShots.map(func(shot):return shot.objectId)
	check("A live hostile shot is inside the fold at one-quarter hull",
		s.enemyShots.any(func(shot):return Space.fold_depth_at(shot.z,s.fields)==1))
	held_time=s.time
	for frame in range(30):
		step(sim,s,{"fire":true,"fold":true})
	check("The second hold preserves hull and time until Right Shift",s.enemies[0].hp==2 and s.time==held_time and s.fields.size()==1)
	check("Right Shift halves chart speed for the same live enemy shot",compare_shot_motion(sim,s,{"unfold":true},"enemyShots",0.5))
	var stacked: Dictionary=s.duplicate(true)
	Space.add_fold(stacked)
	step(sim,stacked,{"unfold":true})
	check("Right Shift resumes after removing one fold when another remains",stacked.fields.size()==1
		and stacked.campaign.training.holdPrompt=="" and stacked.time>held_time)
	step(sim,s,{"unfold":true})
	check("Right Shift opens space and retains the live hostile shots",s.campaign.training.prompt=="finish"
		and s.fields.is_empty() and s.time>held_time and s.enemyShots.map(func(shot):return shot.objectId)==hostile_ids)
	for frame in range(480):
		if s.campaign.index==0:
			break
		step(sim,s,{"fire":true})
	check("The guided fight flows into Two Sides",s.campaign.index==0 and s.phase=="running" and s.hull==5)

func _initialize() -> void:
	var sim=Sim.new();var s=start(sim)
	check("Level 0 retains its index and starts one combat target",s.campaign.index==-1 and s.enemies.size()==1 and s.enemies[0].hp==8)
	check("The opening has no movement checklist",s.campaign.lesson=="engage" and not s.campaign.has("movement"))
	step(sim,s,{"fire":true})
	check("Fire is legal before movement or fold use",s.x==0 and s.events.any(func(e):return e.type=="player-fire"))
	var target=s.enemies[0];var target_id=target.id
	check("Fold is optional and available before a lesson sequence",Space.add_fold(s))
	sim.record_event(s,"fold",{"fields":s.fields.size()})
	var old_shots=s.shots.duplicate(true)
	Space.remove_fold(s);sim.record_event(s,"unfold",{"fields":s.fields.size()})
	check("Unfold retains the same shots and target",s.shots==old_shots and s.enemies[0].id==target_id and s.campaign.lesson=="engage")
	check("Successful optional folds remain recorded",s.campaign.training.folded and s.campaign.training.unfolded)
	s=start(sim)
	var seed={"type":0,"polarity":1,"key":"0:1","id":Data.get_data().operations[0].key,"source":"checkpoint","instance":1}
	s.inventory=[seed];s.equipped=[seed,null];s.upgradeSerial=1;s.score=77;C.enter(s,-1)
	var checkpoint=Store.checkpoint_from_state(s)
	check("Level 0 serializes as its own section checkpoint",checkpoint.chapterIndex==-1 and Store.validate_checkpoint(checkpoint).ok)
	var loaded=Store._restore({"profile":s.fleetProfile,"checkpoint":checkpoint,"preferences":{}}).state
	check("Checkpoint reload restores Level 0 without a movement gate",loaded.campaign.index==-1 and loaded.phase=="paused" and loaded.runSeed==35035 and loaded.enemies.size()==1 and loaded.campaign.lesson=="engage")
	check("Checkpoint reload retains section-entry score and equipment",loaded.score==77 and loaded.equipped[0].key=="0:1")
	s.time=20;s.score+=900;s.hull=1;pair(s,"retry");sim.retry(s)
	var retry_ends=ended(s)
	check("Retry restores Level 0 entry seed, score, hull and time",s.campaign.index==-1 and s.runSeed==35035 and s.score==checkpoint.entry.score and s.time==checkpoint.entry.time and s.hull==5)
	check("Retry records two scene exits at the original terminal time",retry_ends.size()==2 and retry_ends.all(func(e):return e.cause=="scene-exit" and e.time==20))
	s=start(sim)
	C.skip_tutorial_guidance(s)
	for frame in range(1200):
		if s.campaign.lesson=="complete":break
		step(sim,s,{"fire":true})
	check("Skip guidance permits a clear with fire alone",s.campaign.index==-1 and s.campaign.lesson=="complete" and s.x==0 and not s.campaign.training.folded)
	check("The transition delay retains the Level 0 checkpoint",Store.checkpoint_from_state(s).chapterIndex==-1)
	var complete_at=s.campaign.training.completeAt
	for frame in range(150):
		if s.campaign.index==0:break
		step(sim,s,{"fire":true})
	check("The existing delay flows into running Level 1",s.campaign.index==0 and s.phase=="running" and s.time-complete_at>=1.05 and s.campaign.autoFromTutorial)
	check("Level 1 produces its next section checkpoint",Store.checkpoint_from_state(s).chapterIndex==0 and s.runSeed==35035)
	check("Completion requires no movement demonstration event",not s.events.any(func(e):return e.type=="tutorial-movement-complete"))
	s=start(sim)
	C.skip_tutorial_guidance(s)
	for frame in range(1000):step(sim,s)
	check("The opening retains real warnings, shots and ordinary hull damage",s.events.any(func(e):return e.type=="enemy-windup") and s.events.any(func(e):return e.type=="enemy-fire") and s.hull<5)
	check("Level 0 retains the drive-fault exclusion",s.drive.faults==0)
	s=start(sim);pair(s,"training");s.campaign.defeated=1;C.after_tick(s);C.after_tick(s)
	check("Training finish ends both retained shots once with route-exit",ended(s).size()==2 and ended(s).all(func(e):return e.cause=="route-exit") and s.shots.is_empty() and s.enemyShots.is_empty())
	s=start(sim);C.enter(s,0);pair(s,"route");s.cameraZ=s.chapter.routeLength;s.debts=[{"target":"player","due":100,"amount":1}];C.after_tick(s)
	check("Route finish waits for stored player damage",s.phase=="running" and ended(s).is_empty() and s.debts.size()==1)
	s.debts=[];C.after_tick(s);C.after_tick(s)
	check("Route finish records one terminal event per owner",s.phase=="cleared" and ended(s).size()==2 and ended(s).all(func(e):return e.cause=="route-exit"))
	check("Route finish records its speed bonus once",s.events.filter(func(e):return e.type=="speed-bonus").size()==1)
	s=start(sim);var recovery={}
	for index in range(9,27):
		C.enter(s,index)
		for wave in s.campaign.get("wavePlan",[]):
			if wave.kind=="break" and wave.get("clearHostile",false):recovery=wave;break
		if not recovery.is_empty():break
	check("The retained campaign supplies an authored recovery break",not recovery.is_empty())
	if not recovery.is_empty():
		pair(s,"recovery");s.debts=[{"target":"player","due":100,"amount":1}];s.cameraZ=(recovery.at+0.000001)*s.chapter.routeLength;C.tick_director(s)
		check("Recovery ends only hostile shots with recovery-clear",s.enemyShots.is_empty() and s.shots.size()==1 and not s.shots[0].get("dead",false) and ended(s).size()==1 and ended(s)[0].owner=="enemy" and ended(s)[0].cause=="recovery-clear")
		check("Recovery retains stored damage",s.debts.size()==1)
	s=start(sim);pair(s,"chapter");var profile=s.fleetProfile.duplicate(true);C.enter(s,0)
	check("Chapter replacement records scene exits and preserves the run profile",ended(s).size()==2 and ended(s).all(func(e):return e.cause=="scene-exit") and s.runSeed==35035 and s.fleetProfile==profile)
	check_guidance(sim)
	var output="res://../reports/opening-035/native.json"
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--output="):output=argument.substr(9)
	var result={"passed":failures.is_empty(),"checks":checks.size(),"results":checks,"failures":failures,"method":"Headless source-engine simulation with renderer acknowledgment fixtures and in-memory checkpoint serialization/restore.","limits":"No disk save, native rendering, exported target, physical input, or human understanding result is claimed."}
	var file=FileAccess.open(output,FileAccess.WRITE)
	if file==null:push_error("The opening report could not be written.");quit(1);return
	file.store_string(JSON.stringify(result,"  "));file.close();print(JSON.stringify(result));quit(0 if failures.is_empty() else 1)
