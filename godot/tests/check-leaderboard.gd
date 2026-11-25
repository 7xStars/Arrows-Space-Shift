extends SceneTree

const Scene = preload("res://scenes/main.tscn")
const Board = preload("res://scripts/leaderboard.gd")
const Store = preload("res://scripts/save_store.gd")
const Fleet = preload("res://scripts/fleet.gd")
const Sim = preload("res://scripts/flight_simulation.gd")

var checks: Array = []

func _initialize() -> void:
	_verify.call_deferred()

func check(name: String, result: bool) -> void:
	checks.append({"name": name, "passed": result})

func end_flight(app, score: int) -> void:
	app.state.phase = "running"
	app.state.score = score
	app.simulation.damage(app.state, "Endpoint test", app.state.hull, false)
	app._update_ui()

func _verify() -> void:
	var app = Scene.instantiate()
	root.add_child(app)
	app.splash.finish()
	await process_frame
	app._primary_action()
	var original_id: String = app.state.localRankId
	check("New campaign has a local rank identity", Board.valid_id(original_id))
	end_flight(app, 550)
	check("A real lethal transition shows the exact score and rank", app.state.phase == "lost" and app.flight_result.visible and app.flight_result.score_reading.text == "550" and "Local rank 1" in app.flight_result.rank_reading.text)
	check("Death reached the save file", Store.load_game().leaderboard.size() == 1 and Store.load_game().state.localRankId == original_id)
	app._primary_action()
	end_flight(app, 350)
	check("A lower retry keeps one entry and shows current score", app.leaderboard.size() == 1 and app.leaderboard[0].score == 550 and app.flight_result.score_reading.text == "350" and "Campaign best 550" in app.flight_result.rank_reading.text)
	app._primary_action()
	end_flight(app, 700)
	check("A higher retry replaces the same campaign entry", app.leaderboard.size() == 1 and app.leaderboard[0].score == 700)
	var before_practice: Dictionary = app.state.duplicate(true)
	app._primary_action()
	app.state.practice = true
	end_flight(app, 90000)
	check("Practice shows the score and leaves campaign rank alone", app.flight_result.rank_reading.text == "Practice score" and app.leaderboard[0].score == 700)
	app.state = before_practice
	app._new_run()
	check("New campaign has a different ranking identity", app.state.localRankId != original_id)
	Fleet.unlock_klein_fleet(app.state.fleetProfile)
	Fleet.unlock_projective_module(app.state.fleetProfile)
	app.simulation.enter_chapter(app.state, 26)
	app.state.score = 2400
	app.state.phase = "running"
	app.state.campaign.introRemaining = 0.0
	app.state.campaign.bossPhase = "exit"
	app.state.campaign.repairPart = {"id": "curvature-seed", "collected": true}
	app.state.campaign.exit = {"remaining": 0.1, "total": 900.0, "openedAt": -1.0}
	app.preferences.reducedMotion = true
	app.simulation.tick(app.state, {}, 1.0 / 60.0)
	app._update_ui()
	check("Actual extraction transition banks the Seed and the score", app.state.phase == "won" and app.state.fleetProfile.curvatureSeed and app.leaderboard[0].score == 2400 and app.leaderboard[0].complete)
	var reloaded: Dictionary = Store.load_game()
	check("Latest score and the banked Seed survive reload", reloaded.leaderboard.size() == 2 and reloaded.state.fleetProfile.curvatureSeed and reloaded.leaderboard[0].complete)
	check("Reduced motion reveals the full record immediately", app.flight_result.track.reveal == 1.0 and app.flight_result.track.chart_progress == 1.0)
	app._primary_action()
	check("Act III replay remains separate from a ranked new campaign", app.state.campaign.index == 18 and app.state.localRankId.is_empty())
	end_flight(app, 12000)
	check("Partial replay reports score without changing the board", app.flight_result.rank_reading.text == "Unranked flight score" and app.leaderboard[0].score == 2400)
	var export_json: Dictionary = JSON.parse_string(Store.export_progress(app.state, app.preferences))
	check("Portable progress excludes local scores and IDs", not export_json.has("leaderboard") and not export_json.has("localRankId"))
	export_json.leaderboard = [{"id": original_id, "score": 999999, "chapter": 26, "timeMs": 1, "complete": true}]
	export_json.localRankId = original_id
	var imported: Dictionary = Store.import_progress(JSON.stringify(export_json))
	check("An import preserves device scores and does not rank the imported run", imported.get("ok", false) and imported.state.localRankId.is_empty() and imported.leaderboard[0].score == 2400)
	check("The older checkpoint and deferred fields still validate", Store._validate_payload(export_json).ok and export_json.has("actFour") and export_json.has("journey"))
	var candidates: Array = []
	for index in range(24):
		candidates.append({"id": "%024d" % index, "score": index * 10, "chapter": index, "timeMs": 1000, "complete": false})
	candidates.append({"id": candidates[0].id, "score": 5000, "chapter": 26, "timeMs": 900, "complete": true})
	candidates.append({"id": "bad", "score": 99999, "chapter": 24, "timeMs": 900, "complete": true})
	var sorted: Array = Board.clean(candidates)
	check("Leaderboard retains at most ten valid best scores", sorted.size() == 10 and sorted[0].score == 5000 and sorted[1].score == 230 and sorted.back().score == 150)
	var sim = Sim.new()
	var damage_state: Dictionary = sim.create_flight({"seed": 2011978550})
	sim.enter_chapter(damage_state, 4)
	damage_state.phase = "running"
	var carrier: Dictionary = damage_state.enemies.front()
	sim.impact(damage_state, carrier, {"owner": "player", "x": carrier.x, "z": carrier.z, "impactDelay": 0.6, "damage": 2})
	check("A stored hit names the actual carrier", "Carrier %d" % int(carrier.id) in damage_state.lastEvent and damage_state.debts.back().target == carrier.id)
	sim.impact(damage_state, damage_state, {"owner": "enemy", "x": damage_state.x, "z": damage_state.z, "impactDelay": 0.6, "damage": 3})
	check("A player debt names your ship and retains both debts", "your ship" in damage_state.lastEvent and damage_state.debts.size() == 2 and damage_state.debts.back().target == "player")
	var report := {"version": ProjectSettings.get_setting("application/config/version"), "checks": checks}
	var output := FileAccess.open(OS.get_cmdline_user_args()[0], FileAccess.WRITE)
	if output != null:
		output.store_string(JSON.stringify(report, "  "))
		output.close()
	print(JSON.stringify(report))
	app.set_process(false)
	app.set_physics_process(false)
	app.audio.stop()
	await create_timer(0.18, true, false, true).timeout
	quit(1 if checks.any(func(item): return not item.passed) else 0)
