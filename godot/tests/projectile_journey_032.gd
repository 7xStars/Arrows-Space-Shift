extends SceneTree

const Journey = preload("res://scripts/projectile_journey.gd")
const Sim = preload("res://scripts/flight_simulation.gd")
const C = preload("res://scripts/campaign.gd")
const Space = preload("res://scripts/space_core.gd")
const Edge = preload("res://scripts/edge_core.gd")
const Ecology = preload("res://scripts/ecology.gd")
const U = preload("res://scripts/upgrades.gd")
const View = preload("res://scripts/combat_view.gd")
const Boss = preload("res://scripts/boss.gd")
var checks: Array = []
var failures: Array = []
var measurements: Array = []

func check(name: String, condition: bool, details: Variant = null) -> void:
	if details is Dictionary or details is Array:details=details.duplicate(true)
	checks.append({"name": name, "result": "Passed" if condition else "Failed", "details": details})
	if not condition:
		failures.append(name)

func near(a: float, b: float, tolerance: float = 0.000001) -> bool:
	return absf(a - b) <= tolerance

func state(surface: bool = false, projective: bool = false) -> Dictionary:
	return {"runSeed": 32032, "time": 0.0, "fields": [], "events": [], "shots": [], "enemyShots": [],
		"phase": "running", "chapter": {"kind": "boss" if surface else "level", "projectiveBoss": projective},
		"campaign": {}, "x": 0.0, "z": 0.0, "warpCount": 0, "fireClock": 1.0}

func shot(owner: String = "enemy", x: float = 0.0, y: float = 100.0, vx: float = 0.0, vz: float = 145.0) -> Dictionary:
	return {"owner": owner, "x": x, "z": y, "vx": vx, "vz": vz, "payload": []}

func context(s: Dictionary, surface: bool = false, projective: bool = false) -> Dictionary:
	return {"owner": "", "surface": surface, "projective": projective, "axis_sign": 1.0,
		"to_point": func(z: float) -> float: return Space.space_distance(0.0, z, s.fields),
		"from_y": func(y: float) -> float: return Space.advance_through_space(0.0, y, s.fields),
		"contacts": [], "receivers": []}

func advance(s: Dictionary, q: Dictionary, dt: float, ctx: Dictionary) -> Dictionary:
	s.time += dt
	return Journey.advance(s, q, dt, ctx)

func still(x: float, y: float) -> Array:
	return [{"from": {"x": x, "y": y}, "to": {"x": x, "y": y}, "t0": 0.0, "t1": 1.0}]

func ends(s: Dictionary) -> Array:
	return s.events.filter(func(event): return event.type == "projectile-ended")

func check_ranges() -> void:
	for surface in [false, true]:
		for projective in [false, true]:
			if projective and not surface:
				continue
			for owner in ["player", "enemy"]:
				var s: Dictionary = state(surface, projective)
				var speed: float = 680.0 if owner == "player" else 145.0
				var q: Dictionary = shot(owner, 20.0, 100.0, 0.0, speed)
				var ctx: Dictionary = context(s, surface, projective)
				var steps: int = 0
				while not q.get("dead", false) and steps < 1000:
					advance(s, q, 1.0 / 120.0, ctx)
					steps += 1
				var expected: float = 3400.0 if owner == "player" else 1020.0
				check("Range and one terminal event: " + str(surface) + ":" + str(projective) + ":" + owner,
					q.get("dead", false) and near(q.journey.travel, expected) and q.journey.cause == "journey-complete" and ends(s).size() == 1,
					q.journey)
				check("Frozen launch reference: " + owner + ":" + str(surface) + ":" + str(projective),
					q.journey.referenceId == ("P-CENTER-V" if projective else "K-V" if surface else "ROUTE-RANGE-K-V") and q.journey.budget == expected)
	for depth in range(4):
		for owner in ["player", "enemy"]:
			var s: Dictionary = state()
			for index in range(depth):
				s.fields.append({"id": index, "start": -100000.0, "end": 100000.0, "factor": 0.5})
			var speed: float = 680.0 if owner == "player" else 145.0
			var q: Dictionary = shot(owner, 0.0, 100.0, 0.0, speed)
			var ctx: Dictionary = context(s)
			advance(s, q, 0.1, ctx)
			check("Shared fold gain depth " + str(depth) + ":" + owner, near(q.journey.travel, speed * 0.1 * pow(2, depth)), q.journey.travel)
			var before: float = q.journey.travel
			s.fields = []
			Journey.advance(s, q, 0.0, ctx)
			check("Unfold spends no distance depth " + str(depth) + ":" + owner, q.journey.travel == before)
			advance(s, q, 0.1, ctx)
			check("Unfold retains budget depth " + str(depth) + ":" + owner, near(q.journey.travel, before + speed * 0.1) and q.journey.budget == (3400 if owner == "player" else 1020))

func check_ordering() -> void:
	for owner in ["player", "enemy"]:
		for contact_distance in [15.0, 25.0, 30.0]:
			var s: Dictionary = state()
			var q: Dictionary = shot(owner, 0.0, 100.0, 0.0, 100.0)
			Journey.ensure_journey(s, q)
			q.journey.travel = q.journey.budget - 25.0
			var ctx: Dictionary = context(s)
			ctx.contacts = [{"paths": still(0.0, 100.0 + contact_distance + 5.0), "radius": 5.0, "on_hit": func(_q): pass}]
			advance(s, q, 0.5, ctx)
			var contact: bool = contact_distance <= 25.0
			check("First event at contact distance " + str(contact_distance) + ":" + owner,
				q.journey.cause == ("impact" if contact else "journey-complete") and near(q.z, 100.0 + minf(contact_distance, 25.0)) and ends(s).size() == 1, ends(s))
	var s: Dictionary = state()
	var q: Dictionary = shot("enemy", 0.0, 100.0, 0.0, 100.0)
	q.hold = 0.65
	var ctx: Dictionary = context(s)
	advance(s, q, 0.7, ctx)
	check("Hold release consumes time once", near(q.z, 105.0) and near(q.journey.travel, 5.0) and near(q.hold, 0.0), q)
	s = state(); q = shot(); q.hold = 2.0; ctx = context(s)
	ctx.contacts = [{"paths": [{"from": {"x": 0.0, "y": 50.0}, "to": {"x": 0.0, "y": 150.0}, "t0": 0.0, "t1": 1.0}], "radius": 5.0, "on_hit": func(_q): pass}]
	advance(s, q, 1.0, ctx)
	check("A held shot retains moving-body collision", q.journey.cause == "impact" and q.journey.travel == 0.0 and near(q.hold, 1.55), q)
	s = state(); q = shot(); q.vx = 0; q.vz = 0; ctx = context(s)
	advance(s, q, 2.0, ctx)
	check("A stationary shot has no timer fallback", not q.get("dead", false) and q.journey.travel == 0.0)
	var actor: Dictionary = {"id": 1, "x": 0.0, "z": 0.0, "facing": 1, "equipped": [{"type": 0, "polarity": -1}], "clock": 1.0}
	s = state(); q = shot("enemy", 100.0, 150.0, 0.0, -100.0); ctx = context(s)
	ctx.receivers = [{"actor": actor, "key": "enemy-1", "facing": 1, "paths": still(0.0, 0.0)}]
	ctx.contacts = [{"paths": still(0.0, 140.0), "radius": 2.0, "on_hit": func(_q): pass}]
	advance(s, q, 0.5, ctx)
	check("Position Warp preserves identity and omits its gap", not q.get("dead", false) and near(q.x, -100.0) and near(q.journey.travel, 50.0) and s.warpCount == 1 and s.events.filter(func(e): return e.type == "operation").size() == 1, q)
	s = state(); q = shot("enemy", 100.0, 150.0, 0.0, -100.0); ctx = context(s)
	Journey.ensure_journey(s, q); q.journey.travel = 1015.0
	ctx.receivers = [{"actor": actor, "key": "enemy-1", "facing": 1, "paths": still(0.0, 0.0)}]
	advance(s, q, 0.5, ctx)
	check("Budget completion rejects a later operation", q.journey.cause == "journey-complete" and s.warpCount == 0 and not s.events.any(func(e): return e.type == "operation"), s.events)
	var order_outputs: Array = []
	for order in [[0, 1], [1, 0]]:
		s = state(); q = shot("enemy", 100.0, 140.0, 0.0, -100.0); ctx = context(s)
		actor = {"id": 1, "x": 0.0, "z": 0.0, "facing": 1, "equipped": [], "clock": 1.0}
		for type in order:actor.equipped.append({"type": type, "polarity": -1})
		ctx.receivers = [{"actor": actor, "key": "enemy-1", "facing": 1, "paths": still(0.0, 0.0)}]
		advance(s, q, 0.1, ctx); order_outputs.append(q.vx)
	check("Both equipment orders use the changed input", order_outputs[0] == 0.0 and order_outputs[1] == 140.0, order_outputs)
	s = state(); q = shot("enemy", 100.0, 150.0, 0.0, -100.0); ctx = context(s)
	actor.equipped = [{"type": 4, "polarity": -1}]
	ctx.receivers = [{"actor": actor, "key": "enemy-1", "facing": 1, "paths": still(0.0, 0.0)}]
	advance(s, q, 0.2, ctx)
	check("Arrival Delay consumes only the committed remainder", near(q.hold, 0.55) and near(q.journey.travel, 10.0), q)

func curve_run(step: float, projective: bool) -> Dictionary:
	var s: Dictionary = state(true, projective)
	s.fields = [{"id": 1, "start": 150.0, "end": 300.0, "factor": 0.5}]
	var q: Dictionary = shot("player", 390.0, 140.0, 90.0, 145.0)
	q.ax = 320.0; q.curveTime = 0.8
	var ctx: Dictionary = context(s, true, projective)
	for _frame in range(int(round(0.8 / step))):advance(s, q, step, ctx)
	return {"x": q.x, "y": Space.space_distance(0.0, q.z, s.fields), "travel": q.journey.travel,
		"vx": q.vx, "vz": q.vz, "parity": q.transportParity, "crossings": q.get("surfaceCrossings", 0), "events": s.events}

func check_curves() -> void:
	for projective in [false, true]:
		var coarse: Dictionary = curve_run(1.0 / 30.0, projective)
		var fine: Dictionary = curve_run(1.0 / 240.0, projective)
		var half: Dictionary = curve_run(1.0 / 960.0, projective)
		check("Active curve crosses a seam " + str(projective), coarse.crossings > 0 and coarse.parity == 1 and coarse.vz == -145.0 and near(coarse.vx, 346.0), coarse)
		check("Curve frame convergence " + str(projective), near(coarse.x, fine.x, 0.002) and near(coarse.y, fine.y, 0.002) and near(coarse.travel, fine.travel, 0.002), {"coarse": coarse, "fine": fine})
		check("Curve half-step convergence " + str(projective), near(coarse.x, half.x, 0.002) and near(coarse.y, half.y, 0.002) and near(coarse.travel, half.travel, 0.002), {"coarse": coarse, "half": half})
	var s: Dictionary=state(true,true)
	var q: Dictionary=shot("enemy",450.0,100.0,0.0,0.0)
	advance(s,q,1.0,context(s,true,true))
	check("Projective normalization has no path charge",near(q.x,-350.0) and near(q.z,780.0) and q.journey.travel==0.0 and q.transportParity==1,q)

func make_route(sim, index: int = 0) -> Dictionary:
	var s: Dictionary = sim.create_flight({"seed": 32032})
	sim.enter_chapter(s, index); s.phase = "running"; s.countdown = 0.0
	s.chapter = s.chapter.duplicate(true); s.chapter.routeLength = 100000.0
	s.campaign.wavePlan = []; s.campaign.currentWave = {}; s.enemies = []; s.asteroids = []
	s.drive.nextFaultAt = 100000.0
	return s

func check_simulation() -> void:
	var sim = Sim.new()
	var s: Dictionary = make_route(sim)
	var q: Dictionary = shot("player", 800.0, 5000.0, 0.0, 680.0)
	s.shots = [q]
	sim.tick(s, {}, 1.0 / 120.0)
	check("An off-view and far-coordinate player shot remains live", s.shots.size() == 1 and near(q.journey.travel, 680.0 / 120.0), q)
	var before: float = q.journey.travel
	s.phase = "paused"; sim.tick(s, {}, 2.0)
	check("Pause changes neither travel nor time", q.journey.travel == before and near(s.time, 1.0 / 120.0))
	s.phase = "running"
	q = shot("enemy", 800.0, -1000.0, 0.0, -145.0); q.sourceId = 888; s.enemyShots = [q]
	sim.tick(s, {}, 1.0 / 120.0)
	check("Source departure and view exit retain hostile shots", s.enemyShots.size() == 1 and near(q.journey.travel, 145.0 / 120.0), q)
	s = make_route(sim); s.invulnerable = 10.0
	q = shot("enemy", s.x, s.z, 0.0, 0.0); s.enemyShots = [q]
	sim.tick(s, {}, 1.0 / 120.0)
	check("A real protected contact records absorption", q.journey.cause == "absorption" and s.hull == 5.0 and ends(s).size() == 1, ends(s))
	s = make_route(sim); q = shot("enemy", s.x, s.z, 0.0, 0.0); q.impactDelay = 0.8; s.enemyShots = [q]
	sim.tick(s, {}, 1.0 / 120.0)
	check("A real delayed impact ends its shot and retains debt", q.journey.cause == "impact" and s.debts.size() == 1 and s.hull == 5.0, s.debts)
	Journey.end_all(s, "scene-exit")
	check("Scene feedback does not cancel retained debt", s.debts.size() == 1)
	s.time += 1.0; sim.settle_debts(s)
	check("Retained damage pays after its projectile ends", s.debts.is_empty() and s.hull == 4.0)
	s = make_route(sim, 18); s.fleetProfile.projectiveModule = true; s.projective = Ecology.create_state()
	q = shot("enemy", s.x + 30.0, s.z + 30.0, 0.0, 0.0); s.enemyShots = [q]
	check("Real capture creates a resource and ends its hostile shot", Ecology.capture(s) == 1 and q.journey.cause == "capture" and s.projective.echoes == 1, ends(s))
	Ecology.release(s)
	check("Echo release has a new player launch budget", s.shots.size() == 1 and s.shots[0].journey.budget == 3400.0 and s.shots[0].objectId != q.objectId)
	s.projective.upgrades = ["echo-ward"]; s.projective.echoes = 2; s.projective.wardCooldown = 0.0
	q = shot("enemy", s.x, s.z, 0.0, 0.0); s.enemyShots = [q]
	sim.tick(s, {}, 1.0 / 120.0)
	check("A real Ward contact spends stock and records Ward", q.journey.cause == "ward" and s.projective.echoes == 0 and s.hull == 5.0, ends(s))
	s = make_route(sim)
	var warden: Dictionary = {"id": 12, "name": "Klein Warden", "hp": 3.0, "maxHp": 10.0, "specialPhase": 1, "clock": 1.0, "x": 0.0, "z": 500.0}
	q = shot(); q.sourceId = 12; s.enemyShots = [q]
	sim.special_phase(s, warden)
	check("A real Warden phase clear records its cause", q.journey.cause == "phase-clear" and s.enemyShots.is_empty(), ends(s))
	for index in [8, 17, 26]:
		s = sim.create_flight({"seed": 32032}); sim.enter_chapter(s, index); s.phase = "running"; s.campaign.introRemaining = 0.0
		for enemy in s.enemies:enemy.clock = 10000.0; enemy.driftX = 0.0; enemy.driftY = 0.0
		q = shot("player", 350.0, C.arena_z(s, 100.0), 0.0, 680.0); s.shots = [q]
		sim.tick(s, {}, 1.0 / 120.0)
		check("Boss uses the common journey resolver index " + str(index), q.has("journey") and near(q.journey.travel, 680.0 / 120.0), q.get("journey"))
	for index in [8,9]:
		s=sim.create_flight({"seed":32032});sim.enter_chapter(s,index);s.phase="running"
		var receiver: Dictionary={"id":123,"x":0.0,"z":C.arena_z(s,500.0),"hp":100.0,"maxHp":100.0,"stage":s.stage,"presented":true,"visibleFor":1.0,"facing":-1,"equipped":[{"type":5,"polarity":1}],"clock":10000.0}
		s.enemies=[receiver];s.asteroids=[]
		q=shot("player",-90.0,C.arena_z(s,100.0),0.0,680.0);s.shots=[q]
		for frame in range(150):
			if q.get("journey",{}).get("travel",0.0)>=2200.0:break
			s.time+=0.1;sim.advance_projectile(s,q,0.1)
		var operations: int=s.events.filter(func(e):return e.type=="operation").size()
		check("Retained gate semantics index "+str(index),operations>=2 if index==8 else operations==1,{"operations":operations,"travel":q.journey.travel,"vz":q.vz})
		if index==9:
			C.reset_entry(s,receiver,"bottom",true)
			check("An actor return clears its surface receiver gate",not q.get("gates",{}).has("enemy-123"))
	for owner in ["player","enemy"]:
		for first_contact in [15.0,25.0,30.0]:
			s=make_route(sim)
			q=shot(owner,100.0,s.z+100.0,0.0,100.0);Journey.ensure_journey(s,q);q.journey.travel=q.journey.budget-25.0
			var rock: Dictionary={"id":1,"x":100.0,"z":q.z+first_contact+5.0,"radius":5.0,"hp":2.0,"presented":true};s.asteroids=[rock]
			sim.advance_projectile(s,q,0.5)
			check("Real asteroid order "+owner+":"+str(first_contact),q.journey.cause==("impact" if first_contact<=25.0 else "journey-complete") and rock.hp==(1.0 if first_contact<=25.0 else 2.0),ends(s))
	s=sim.create_flight({"seed":32032});sim.enter_chapter(s,8);s.phase="running";s.campaign.introRemaining=0.0
	for enemy in s.enemies:enemy.equipped=[];enemy.clock=10000.0;enemy.driftX=0.0;enemy.driftY=0.0
	q=shot("player",350.0,C.arena_z(s,100.0),0.0,680.0);q.hold=10.0;s.shots=[q]
	var hostile: Dictionary=shot("enemy",350.0,C.arena_z(s,700.0),0.0,-145.0);hostile.hold=10.0;s.enemyShots=[hostile]
	for frame in range(960):sim.tick(s,{},1.0/120.0)
	check("Held boss shots have no five/seven second timer",not q.get("dead",false) and not hostile.get("dead",false) and q.journey.travel==0.0 and hostile.journey.travel==0.0,{"player":q.journey,"enemy":hostile.journey})
	s=make_route(sim)
	var target: Dictionary={"id":777,"x":100.0,"z":400.0,"hp":1.0,"stage":s.stage,"presented":true,"visibleFor":1.0,"facing":-1,"equipped":[{"type":4,"polarity":1}]}
	s.enemies=[target]
	var cache: Dictionary={}
	q=shot("player",100.0,385.0,0.0,100.0)
	sim.advance_projectile(s,q,0.2,{},null,{},{},cache)
	var later: Dictionary=shot("player",100.0,385.0,0.0,100.0)
	sim.advance_projectile(s,later,0.2,{},null,{},{},cache)
	check("Cached targets retain live damage and operation eligibility",target.hp<=0.0 and not later.get("dead",false) and near(later.journey.travel,20.0) and not later.get("gates",{}).has("enemy-777"),later)
	s=make_route(sim);target={"id":778,"x":100.0,"z":400.0,"hp":1.0,"stage":s.stage,"presented":true,"visibleFor":1.0,"facing":-1,"equipped":[]};s.enemies=[target]
	q=shot("player",0.0,385.0,0.0,100.0);sim.advance_projectile(s,q,0.1)
	target.x=0.0;later=shot("player",0.0,385.0,0.0,100.0);sim.advance_projectile(s,later,0.1)
	check("Manual calls rebuild context without a tick cache",later.get("dead",false) and target.hp<=0.0)
	s=make_route(sim);s.x=0.0;s.z=100.0;cache={}
	q=shot("enemy",100.0,200.0,0.0,-100.0);sim.advance_projectile(s,q,1.0,{},null,{},{},cache)
	later=shot("enemy",100.0,200.0,0.0,-100.0);later.halfWidth=100.0;sim.advance_projectile(s,later,1.0,{},null,{},{},cache)
	check("Cached contacts retain each projectile salvo width",not q.get("dead",false) and later.get("dead",false) and s.hull==4.0,{"narrow":q,"wide":later})
	s=sim.create_flight({"seed":32032});sim.enter_chapter(s,17);s.phase="running";s.campaign.hybridPhase=2;cache={}
	q=shot("enemy",120.0,C.arena_z(s,940.0),0.0,145.0);q.projective=false;sim.advance_projectile(s,q,0.2,{},null,{},{},cache)
	later=shot("enemy",120.0,C.arena_z(s,940.0),0.0,145.0);later.projective=true;sim.advance_projectile(s,later,0.2,{},null,{},{},cache)
	check("Cached context retains each shot's active hybrid edge rule",near(q.x,120.0) and near(later.x,-120.0) and q.transportParity==0 and later.transportParity==1 and q.journey.referenceId=="HYBRID-K-V" and later.journey.referenceId=="HYBRID-P-CENTER-V",{"klein":q,"projective":later})

func check_pressure() -> void:
	var sim = Sim.new()
	for index in [0, 9, 18]:
		var s: Dictionary = sim.create_flight({"seed": 32032}); sim.enter_chapter(s, index); s.phase = "running"; s.countdown = 0.0
		s.hull = 1000.0; s.drive.nextFaultAt = 100000.0
		var peak_player: int = 0; var peak_hostile: int = 0; var returns: int = 0
		var start: int = Time.get_ticks_msec()
		var tick_milliseconds: Array=[]
		for frame in range(3600):
			for enemy in s.enemies:
				if View.in_view(s, enemy):enemy.presented = true
			var tick_start: int=Time.get_ticks_usec()
			sim.tick(s, {"fire": true, "horizontal": sin(float(frame) / 110.0)}, 1.0 / 120.0)
			tick_milliseconds.append(float(Time.get_ticks_usec()-tick_start)/1000.0)
			peak_player = maxi(peak_player, s.shots.size()); peak_hostile = maxi(peak_hostile, s.enemyShots.size())
			if s.phase != "running":break
		for event in s.events:
			if event.type in ["enemy-return", "klein-crossing"]:returns += 1
		var row: Dictionary = {"chapter": index, "simulatedSeconds": s.time, "wallMilliseconds": Time.get_ticks_msec() - start,
			"peakPlayer": peak_player, "peakHostile": peak_hostile, "returns": returns,
			"damage": 1000.0 - s.hull, "enemyFire": s.events.filter(func(e): return e.type == "enemy-fire").size(),
			"terminalEvents": ends(s).size(), "endedOverBudget": ends(s).filter(func(e): return e.travel > e.budget + 0.000001).size()}
		var first_three: Array=tick_milliseconds.slice(0,mini(360,tick_milliseconds.size()));first_three.sort()
		tick_milliseconds.sort()
		var total: float=0.0
		for value in tick_milliseconds:total+=float(value)
		row.tickMeanMs=total/maxi(1,tick_milliseconds.size())
		row.tickP95Ms=tick_milliseconds[mini(tick_milliseconds.size()-1,int(floor(tick_milliseconds.size()*0.95)))]
		row.firstThreeSecondsP95Ms=first_three[mini(first_three.size()-1,int(floor(first_three.size()*0.95)))]
		measurements.append(row)
		check("Sustained combat retains finite journey budgets index " + str(index), row.endedOverBudget == 0 and s.shots.all(func(q): return q.journey.travel <= q.journey.budget + 0.000001), row)
		print(JSON.stringify(row))

func _initialize() -> void:
	check_ranges(); print("Native journey range checks complete.")
	check_ordering(); print("Native journey ordering checks complete.")
	check_curves(); print("Native journey curve checks complete.")
	check_simulation(); print("Native journey simulation checks complete.")
	check_pressure()
	check("All planned native checks executed",checks.size()==87,checks.size())
	var output: String = "res://../reports/journey-032/native-v1.json"
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--output="):output = argument.trim_prefix("--output=")
	var file: FileAccess = FileAccess.open(output, FileAccess.WRITE)
	file.store_string(JSON.stringify({"engine": Engine.get_version_info().string, "checks": checks,
		"passed": checks.size() - failures.size(), "failed": failures.size(), "failures": failures,
		"measurements": measurements, "limits": ["Headless GDScript checks do not establish rendered or audible target behavior.", "Curved distance uses bounded chord sums.", "Human combat feel and understanding were not tested."]}, "\t"))
	file.close()
	print(JSON.stringify({"passed": checks.size() - failures.size(), "failed": failures.size(), "failures": failures}))
	quit(0 if failures.is_empty() else 1)
