extends Control

const Data = preload("res://scripts/game_data.gd")
const FlightView = preload("res://scripts/flight_view.gd")
const Splash = preload("res://scripts/splash.gd")
const Fleet = preload("res://scripts/fleet.gd")
const Campaign = preload("res://scripts/campaign.gd")
const DialogInput = preload("res://scripts/dialog_input.gd")
const OperationsGuide = preload("res://scripts/upgrades.gd")
const FoldExample = preload("res://scripts/fold_example.gd")
const STEP: float = 1.0 / 60.0
var _probe_step: float = STEP
const Leaderboard = preload("res://scripts/leaderboard.gd")
const FlightResult = preload("res://scripts/flight_result.gd")
const FLIGHT_OBJECTIVE := "DAMAGED WARP DRIVE · FIND THE REPAIR PARTS"
const PARTS_SAVED := "THREE DRIVE PARTS SAVED"
const FLIGHT_CONTROLS := "Left / Right steer · Space fires · Left Shift folds · Right Shift unfolds"
const FIRST_CONTACT_FOLD_HINT := "Use Left Shift to make a fold in front of your ship. Your shots and enemy shots move faster in a fold."
const STEERING_CONTROLS := "Use Left Arrow, Home, or number pad 4 to move left. Use Right Arrow, End, or number pad 6 to move right."
const FLIGHT_PRESS_KEYS := {
	"leftPressed": [KEY_LEFT, KEY_HOME, KEY_KP_4],
	"rightPressed": [KEY_RIGHT, KEY_END, KEY_KP_6],
	"firePressed": [KEY_SPACE],
}
const VERTICAL_FLIGHT_KEYS := [KEY_UP, KEY_PAGEUP, KEY_KP_8, KEY_DOWN, KEY_PAGEDOWN, KEY_KP_2]

var simulation: Object
var store: GDScript
var audio: Node
var flight_view: Control
var state: Dictionary = {}
var preferences: Dictionary = {}
var held: Dictionary = {}
var pressed: Dictionary = {}
var accumulator: float = 0.0
var clear_time: float = 0.0
var hud_clock: float = 0.0
var last_save_signature: String = ""
var qa: bool = false
var splash: Control
var bridge: Object
var qa_callback: Variant
var event_cursor: int = 0
var modal: Window
var modal_kind: String = ""
var status: Label
var readings: Label
var information: Label
var notice: Label
var controls: Label
var progress: ProgressBar
var primary: Button
var new_run: Button
var pause_button: Button
var sound_button: Button
var capture_button: Button
var release_button: Button
var skip_guidance_button: Button
var overlay: PanelContainer
var overlay_title: Label
var overlay_body: Label
var overlay_note: Label
var overlay_box: VBoxContainer
var eyebrow: Label
var root_box: VBoxContainer
var overlay_center: CenterContainer
var tutorial_prompt_center: CenterContainer
var tutorial_prompt: PanelContainer
var tutorial_prompt_action: Label
var tutorial_prompt_detail: Label
var tutorial_prompt_text: String = ""
var last_phase: String = ""
var last_chapter: int = -999
var last_tutorial_hold_prompt: String = ""
var recorded_receipt: String = ""
var practice_return: Dictionary = {}
var qa_clip_active: bool = false
var leaderboard: Array = []
var flight_result: VBoxContainer
var shown_result: Dictionary = {}
var steering_probe_enabled: bool = false
var steering_probe_callback: Variant
var steering_probe: Dictionary = {}

func _ready() -> void:
	get_viewport().gui_embed_subwindows = true
	qa = OS.get_cmdline_user_args().has("--qa")
	steering_probe_enabled = OS.get_cmdline_user_args().has("--timing-probe")
	if OS.has_feature("web") and Engine.has_singleton("JavaScriptBridge"):
		bridge = Engine.get_singleton("JavaScriptBridge")
		var local_host: bool = bool(bridge.eval("['127.0.0.1','localhost'].includes(location.hostname)", true))
		if local_host and bool(bridge.eval("new URLSearchParams(location.search).get('physicsProbe') === '60'", true)):
			Engine.physics_ticks_per_second = 60
			_probe_step = 1.0 / 60.0
		qa = local_host and (qa or bool(bridge.eval("new URLSearchParams(location.search).get('qa') === '1'", true)))
		steering_probe_enabled = local_host and bool(bridge.eval("new URLSearchParams(location.search).get('timingProbe') === '1'", true))
	simulation = load("res://scripts/flight_simulation.gd").new()
	store = load("res://scripts/save_store.gd")
	var saved: Dictionary = {} if qa else store.load_game()
	leaderboard = saved.get("leaderboard", [])
	preferences = Data.get_data().get("defaultPreferences", {}).duplicate(true)
	preferences.merge(saved.get("preferences", {}), true)
	state = saved.get("state", {})
	if state.is_empty():
		state = simulation.create_flight()
	else:
		state.phase = "ready"
	if not state.has("localRankId"):
		state.localRankId = Leaderboard.new_run_id()
	_build_theme()
	_build_ui()
	audio = load("res://scripts/game_audio.gd").new()
	add_child(audio)
	audio.set_preferences(preferences)
	show_splash()
	_install_bridge()
	_update_ui()
	get_window().focus_exited.connect(_on_focus_lost)
	if not OS.has_feature("web"):
		get_tree().set_auto_accept_quit(false)
		get_window().close_requested.connect(_close_after_audio, CONNECT_ONE_SHOT)
	resized.connect(_resize)
	_resize()

func _close_after_audio() -> void:
	set_process(false)
	set_physics_process(false)
	set_process_unhandled_key_input(false)
	audio.stop()
	# Give the audio server time to release the stopped streams.
	await get_tree().create_timer(0.15, true, false, true).timeout
	get_tree().quit()

func _build_theme() -> void:
	theme = Theme.new()
	theme.default_font_size = 15
	theme.set_color("font_color", "Label", Color("f0e4bd"))
	var normal := StyleBoxFlat.new()
	normal.bg_color = Color("111c23")
	normal.border_color = Color("425762")
	normal.set_border_width_all(1)
	normal.set_corner_radius_all(4)
	normal.content_margin_left = 12
	normal.content_margin_right = 12
	normal.content_margin_top = 8
	normal.content_margin_bottom = 8
	theme.set_stylebox("normal", "Button", normal)
	var hover: StyleBoxFlat = normal.duplicate()
	hover.bg_color = Color("23363e")
	hover.border_color = Color("96c7ca")
	theme.set_stylebox("hover", "Button", hover)
	var down: StyleBoxFlat = hover.duplicate()
	down.bg_color = Color("34515b")
	theme.set_stylebox("pressed", "Button", down)
	var focus: StyleBoxFlat = normal.duplicate()
	focus.bg_color = Color.TRANSPARENT
	focus.border_color = Color("96c7ca")
	focus.set_border_width_all(2)
	theme.set_stylebox("focus", "Button", focus)
	theme.set_color("font_color", "Button", Color("f0e4bd"))
	theme.set_color("font_hover_color", "Button", Color("fff3d4"))
	theme.set_color("font_pressed_color", "Button", Color("fff3d4"))
	theme.set_stylebox("panel", "PanelContainer", _panel_style())

func _panel_style() -> StyleBoxFlat:
	var panel := StyleBoxFlat.new()
	panel.bg_color = Color("0c151c")
	panel.border_color = Color("50636a")
	panel.set_border_width_all(1)
	panel.set_corner_radius_all(5)
	panel.content_margin_left = 22
	panel.content_margin_right = 22
	panel.content_margin_top = 20
	panel.content_margin_bottom = 20
	return panel

func _build_ui() -> void:
	var background := ColorRect.new()
	background.color = Color("030608")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 12)
	margin.add_theme_constant_override("margin_right", 12)
	margin.add_theme_constant_override("margin_top", 10)
	margin.add_theme_constant_override("margin_bottom", 10)
	add_child(margin)
	root_box = VBoxContainer.new()
	root_box.add_theme_constant_override("separation", 7)
	margin.add_child(root_box)
	var title_row := HBoxContainer.new()
	root_box.add_child(title_row)
	status = _label("Arrow Space Shift", 17)
	status.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	status.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	title_row.add_child(status)
	readings = _label("Hull 5/5", 15)
	readings.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	title_row.add_child(readings)
	var toolbar := HFlowContainer.new()
	toolbar.add_theme_constant_override("h_separation", 6)
	toolbar.add_theme_constant_override("v_separation", 5)
	root_box.add_child(toolbar)
	pause_button = _button("Pause", _toggle_pause)
	toolbar.add_child(pause_button)
	for item in [["Equipment", "equipment"], ["Practice", "practice"], ["Guide", "guide"], ["Options", "options"]]:
		var kind: String = item[1]
		toolbar.add_child(_button(item[0], func(): _open_menu(kind)))
	toolbar.add_child(_button("Leaderboard", func(): _open_menu("leaderboard")))
	sound_button = _button("Sound on", _toggle_sound)
	toolbar.add_child(sound_button)
	information = _label("Open space 1× · Folds 0/3 · Stored damage 0", 13)
	information.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	root_box.add_child(information)
	flight_view = FlightView.new()
	flight_view.name = "FlightView"
	flight_view.state = state
	flight_view.preferences = preferences
	flight_view.size_flags_vertical = Control.SIZE_EXPAND_FILL
	flight_view.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	flight_view.custom_minimum_size = Vector2(0, 160)
	flight_view.resized.connect(_resize)
	root_box.add_child(flight_view)
	_build_tutorial_prompt()
	overlay_center = CenterContainer.new()
	overlay_center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay_center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	flight_view.add_child(overlay_center)
	overlay = PanelContainer.new()
	overlay.custom_minimum_size = Vector2(500, 0)
	overlay_center.add_child(overlay)
	overlay_box = VBoxContainer.new()
	overlay_box.add_theme_constant_override("separation", 15)
	overlay.add_child(overlay_box)
	eyebrow = _label(FLIGHT_OBJECTIVE, 11)
	eyebrow.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	eyebrow.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	eyebrow.add_theme_color_override("font_color", Color("b4a170"))
	overlay_box.add_child(eyebrow)
	overlay_title = _label("Arrow Space Shift", 40)
	overlay_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	overlay_title.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	overlay_box.add_child(overlay_title)
	overlay_body = _label("Begin at Level 0.", 16)
	overlay_body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	overlay_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	overlay_box.add_child(overlay_body)
	flight_result = FlightResult.new()
	flight_result.hide()
	overlay_box.add_child(flight_result)
	primary = _button("Begin at Level 0", _primary_action)
	primary.custom_minimum_size.y = 46
	overlay_box.add_child(primary)
	new_run = _button("Begin a new run", _new_run)
	overlay_box.add_child(new_run)
	overlay_note = _label(FLIGHT_CONTROLS, 12)
	overlay_note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	overlay_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	overlay_note.add_theme_color_override("font_color", Color("a7b8bd"))
	overlay_box.add_child(overlay_note)
	progress = ProgressBar.new()
	progress.show_percentage = false
	progress.custom_minimum_size.y = 4
	progress.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root_box.add_child(progress)
	notice = _label("Recover the missing parts.", 13)
	notice.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	root_box.add_child(notice)
	var bottom := HFlowContainer.new()
	bottom.add_theme_constant_override("h_separation", 7)
	bottom.add_theme_constant_override("v_separation", 4)
	root_box.add_child(bottom)
	controls = _label("Left / Right steer · Space fire · L.Shift fold · R.Shift unfold · P pause", 12)
	controls.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	controls.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom.add_child(controls)
	skip_guidance_button = _button("Skip guidance", _skip_guidance)
	skip_guidance_button.hide()
	bottom.add_child(skip_guidance_button)
	capture_button = _button("C · Capture", func(): pressed.capture = true)
	release_button = _button("E · Release", func(): pressed.release = true)
	bottom.add_child(capture_button)
	bottom.add_child(release_button)

func _build_tutorial_prompt() -> void:
	tutorial_prompt_center = CenterContainer.new()
	tutorial_prompt_center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tutorial_prompt_center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	flight_view.add_child(tutorial_prompt_center)
	tutorial_prompt = PanelContainer.new()
	tutorial_prompt.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tutorial_prompt.focus_mode = Control.FOCUS_NONE
	var panel := _panel_style()
	panel.border_color = Color("96c7ca")
	panel.content_margin_top = 8
	panel.content_margin_bottom = 8
	panel.content_margin_left = 14
	panel.content_margin_right = 14
	tutorial_prompt.add_theme_stylebox_override("panel", panel)
	tutorial_prompt_center.add_child(tutorial_prompt)
	var box := VBoxContainer.new()
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	box.add_theme_constant_override("separation", 4)
	tutorial_prompt.add_child(box)
	var heading := _label("Flight held", 11)
	heading.mouse_filter = Control.MOUSE_FILTER_IGNORE
	heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	heading.add_theme_color_override("font_color", Color("96c7ca"))
	box.add_child(heading)
	tutorial_prompt_action = _label("", 28)
	tutorial_prompt_action.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tutorial_prompt_action.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tutorial_prompt_action.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tutorial_prompt_action.add_theme_color_override("font_color", Color("fff3d4"))
	box.add_child(tutorial_prompt_action)
	tutorial_prompt_detail = _label("", 15)
	tutorial_prompt_detail.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tutorial_prompt_detail.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tutorial_prompt_detail.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(tutorial_prompt_detail)
	tutorial_prompt.hide()
	tutorial_prompt.resized.connect(_place_tutorial_prompt)

func _label(text: String, font_size: int) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	return label

func _button(text: String, action: Callable) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size.y = 36
	button.pressed.connect(func():
		action.call()
		if state.get("phase", "") == "running" and not is_instance_valid(modal):
			get_viewport().gui_release_focus())
	return button

func show_splash() -> void:
	splash = Splash.new()
	splash.name = "CustomSplash"
	splash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	splash.reduced_motion = bool(preferences.get("reducedMotion", false))
	add_child(splash)
	splash.finished.connect(func(): splash = null; _update_ui())

func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey:
		return
	var key: int = event.physical_keycode if event.physical_keycode else event.keycode
	if is_instance_valid(splash):
		if event.pressed and key in [KEY_ENTER, KEY_SPACE, KEY_ESCAPE]:
			splash.finish()
			get_viewport().set_input_as_handled()
		return
	if is_instance_valid(modal):
		return
	if state.get("phase", "") == "running" and key in VERTICAL_FLIGHT_KEYS:
		get_viewport().set_input_as_handled()
		return
	var action := _flight_press_action(key)
	if not action.is_empty() or key in [KEY_C, KEY_E]:
		get_viewport().set_input_as_handled()
		if not event.echo:
			if event.pressed and not action.is_empty() and not _flight_action_held(action):
				pressed[action] = true
				if steering_probe.get("armed", false) and not steering_probe.has("receivedUs") and action in ["leftPressed", "rightPressed"]:
					steering_probe.receivedUs = Time.get_ticks_usec()
					steering_probe.direction = -1 if action == "leftPressed" else 1
					steering_probe.startX = float(state.x)
			held[key] = event.pressed
		return
	if not event.pressed or event.echo:
		return
	if key in [KEY_P, KEY_ESCAPE]:
		_toggle_pause()
		get_viewport().set_input_as_handled()
	elif key == KEY_SHIFT:
		match event.location:
			KEY_LOCATION_LEFT: pressed.fold = true
			KEY_LOCATION_RIGHT: pressed.unfold = true
			_: return
		get_viewport().set_input_as_handled()
	elif key == KEY_ENTER and overlay.visible:
		_primary_action()
		get_viewport().set_input_as_handled()

func _flight_press_action(key: int) -> String:
	for action: String in FLIGHT_PRESS_KEYS:
		if key in FLIGHT_PRESS_KEYS[action]:
			return action
	return ""

func _flight_action_held(action: String) -> bool:
	for key: int in FLIGHT_PRESS_KEYS[action]:
		if held.get(key, false):
			return true
	return false

func _physics_process(delta: float) -> void:
	if state.is_empty() or is_instance_valid(splash) or is_instance_valid(modal):
		return
	if state.get("phase", "") == "running":
		accumulator = minf(accumulator + delta, 0.25)
		while accumulator >= _probe_step:
			flight_view.acknowledge_visible()
			var input: Dictionary = {
				"horizontal": int(_flight_action_held("rightPressed")) - int(_flight_action_held("leftPressed")),
				"fire": _flight_action_held("firePressed"),
				"capture": held.get(KEY_C, false) or pressed.get("capture", false),
				"release": held.get(KEY_E, false) or pressed.get("release", false),
				"fold": pressed.get("fold", false),
				"unfold": pressed.get("unfold", false),
				"leftPressed": pressed.get("leftPressed", false),
				"rightPressed": pressed.get("rightPressed", false),
				"firePressed": pressed.get("firePressed", false),
			}
			simulation.tick(state, input, _probe_step)
			if steering_probe.has("receivedUs") and not steering_probe.has("acceptedUs") and int(input.horizontal) == int(steering_probe.direction) and not is_equal_approx(float(state.x), float(steering_probe.startX)):
				steering_probe.acceptedUs = Time.get_ticks_usec()
				steering_probe.acceptedX = float(state.x)
				flight_view.steering_draw_probe = _steering_drawn
			pressed.clear()
			accumulator -= _probe_step
	else:
		accumulator = 0.0
	if state.get("phase", "") == "cleared" and not bool(state.get("practice", false)):
		clear_time += delta
		if clear_time > 1.5:
			_advance()
	else:
		clear_time = 0.0
	var phase: String = str(state.get("phase", ""))
	var index: int = int(state.get("campaign", {}).get("index", -1))
	if phase != last_phase or index != last_chapter:
		_update_ui()
		if phase in ["running", "cleared", "won", "lost"]:
			_save()
		last_phase = phase
		last_chapter = index
	elif phase == "running" and Campaign.tutorial_hold_prompt(state) != last_tutorial_hold_prompt:
		_update_ui()

func _process(delta: float) -> void:
	if state.is_empty():
		return
	if is_instance_valid(audio):
		audio.process_state(state)
	hud_clock += delta
	if hud_clock >= 0.1:
		hud_clock = 0.0
		_update_ui()
		_publish_diagnostic()

func _resize() -> void:
	if not is_instance_valid(flight_view) or not is_instance_valid(overlay):
		return
	var compact: bool = size.x < 700
	var field_width: float = flight_view.size.x
	tutorial_prompt.custom_minimum_size.x = floorf(minf(354.0, field_width * 0.76))
	var prompt_size: int = 21 if field_width <= 320.0 else 24 if compact else 28
	tutorial_prompt_action.add_theme_font_size_override("font_size", prompt_size)
	var detail_size: int = 13 if flight_view.size.y < 350.0 else 14 if compact else 15
	tutorial_prompt_detail.add_theme_font_size_override("font_size", detail_size)
	_place_tutorial_prompt()
	overlay.custom_minimum_size.x = minf(500, maxf(220, size.x - 52))
	overlay_title.add_theme_font_size_override("font_size", 24 if compact else 40)
	overlay_body.add_theme_font_size_override("font_size", 14 if compact else 16)
	overlay_box.add_theme_constant_override("separation", 9 if compact or flight_view.size.y < 400 else 15)
	eyebrow.visible = flight_view.size.y >= 360
	overlay_note.visible = flight_view.size.y >= 400 and not flight_result.visible
	var panel: StyleBoxFlat = _panel_style()
	if compact or flight_view.size.y < 400:
		panel.content_margin_top = 14
		panel.content_margin_bottom = 14
		panel.content_margin_left = 14
		panel.content_margin_right = 14
	overlay.add_theme_stylebox_override("panel", panel)
	readings.add_theme_font_size_override("font_size", 12 if compact else 15)
	status.add_theme_font_size_override("font_size", 14 if compact else 17)
	if is_instance_valid(modal):
		modal.size = Vector2i(int(minf(690, maxf(250, size.x - 32))), int(minf(650, maxf(240, size.y - 48))))
		modal.position = Vector2i((size - Vector2(modal.size)) * 0.5)

func _update_ui() -> void:
	if not is_instance_valid(status) or state.is_empty():
		return
	_sync_profile()
	flight_view.state = state
	flight_view.preferences = preferences
	var chapter: Dictionary = state.get("chapter", {})
	var campaign: Dictionary = state.get("campaign", {})
	var index: int = int(campaign.get("index", -1))
	var phase: String = str(state.get("phase", "ready"))
	var result_screen: bool = phase == "lost" or (phase == "won" and index == 26 and bool(state.get("fleetProfile", {}).get("curvatureSeed", false)))
	var guided: bool = index == -1 and bool(campaign.get("training", {}).get("guided", true))
	state.view = {"width": flight_view.size.x, "height": flight_view.size.y, "topInset": 18.0, "bottomInset": 18.0}
	status.text = "Act I · First contact" if index == -1 else ("Act %s · " % str(chapter.get("act", 1))) + str(chapter.get("name", "Flight"))
	readings.text = "HULL %s/5   TIME %.2f s   SCORE %s" % [str(state.get("hull", 5)), float(state.get("time", 0)), str(state.get("score", 0))]
	var fields: Array = state.get("fields", [])
	var debt: float = 0.0
	for item in state.get("debts", []):
		if str(item.get("target", "player")) == "player":
			debt += float(item.get("amount", 1))
	var sides: Array[String] = []
	var operations: Array = Data.get_data().get("operations", [])
	for seed in state.get("equipped", []):
		if not seed is Dictionary:
			continue
		var accepted: int = int(seed.get("polarity", 1)) * (1 if fields.size() % 2 else -1)
		var code: String = str(operations[int(seed.get("type", 0))].get("code", ""))
		sides.append(code + ":" + ("Right" if accepted == 1 else "Left"))
	var side: String = " / ".join(sides) if not sides.is_empty() else "None equipped"
	var debt_text: String = str(int(debt)) if is_equal_approx(debt, floorf(debt)) else str(debt)
	information.text = "%s space · Folds %d/%d · Accepted %s · Stored damage %s" % ["Open" if fields.is_empty() else "Folded", fields.size(), int(state.get("maxFolds", 3)), side, debt_text]
	if state.get("projective") is Dictionary:
		information.text += " · Echoes %d/%d" % [int(state.projective.get("echoes", 0)), int(state.projective.get("capacity", 6))]
		if phase == "running":
			information.text += _recent_echo_action()
	progress.max_value = float(chapter.get("routeLength", 1.0))
	progress.value = clampf(float(state.get("cameraZ", 0.0)), 0.0, progress.max_value)
	progress.visible = chapter.get("kind", "") == "level" and not result_screen
	information.visible = not result_screen
	notice.visible = not result_screen
	controls.visible = not result_screen
	pause_button.visible = not result_screen
	pause_button.text = "Resume" if phase == "paused" else "Pause"
	pause_button.disabled = not phase in ["running", "paused"]
	sound_button.text = "Sound on" if preferences.get("sound", true) else "Sound off"
	capture_button.visible = state.get("projective") is Dictionary and not result_screen
	release_button.visible = capture_button.visible
	skip_guidance_button.visible = guided and phase in ["ready", "running"] and not is_instance_valid(splash) and not is_instance_valid(modal)
	controls.text = "Left / Right steer · Space fire · L.Shift fold · R.Shift unfold · P pause" + (" · C capture · E release" if capture_button.visible else "")
	if guided:
		controls.text = "Left / Right steer · P pause"
	var guidance_running: bool = guided and phase == "running"
	var notice_size: int = (14 if size.x < 400.0 else 16) if guidance_running else 13
	if notice.get_theme_font_size("font_size") != notice_size:
		notice.add_theme_font_size_override("font_size", notice_size)
	var notice_line_height: float = ceilf(notice.get_theme_font("font").get_height(notice_size))
	notice.custom_minimum_size.y = notice_line_height * 2.0 + notice.get_theme_constant("line_spacing") if guidance_running else 0.0
	last_tutorial_hold_prompt = Campaign.tutorial_hold_prompt(state) if guidance_running else ""
	_update_tutorial_prompt(last_tutorial_hold_prompt, campaign.get("training", {}))
	notice.text = "" if tutorial_prompt.visible else _current_notice()
	overlay.visible = phase in ["ready", "paused", "cleared", "won", "lost"] and not is_instance_valid(modal) and not qa_clip_active
	var profile: Dictionary = state.get("fleetProfile", {})
	var practice: bool = bool(state.get("practice", false))
	var parts: Array = profile.get("driveParts", [])
	var has_all_parts: bool = parts.has("klein-relay") and parts.has("projective-module") and parts.has("curvature-seed")
	new_run.visible = not practice and (phase == "lost" or (phase == "won" and index == 26) or (phase == "ready" and (bool(state.get("restoredCheckpoint", false)) or bool(profile.get("curvatureSeed", false)))))
	primary.disabled = false
	eyebrow.text = FLIGHT_OBJECTIVE
	if practice:
		eyebrow.text = "PRACTICE FLIGHT"
	elif index >= 18 and has_all_parts:
		eyebrow.text = PARTS_SAVED
	overlay_note.text = FLIGHT_CONTROLS
	if phase == "ready":
		overlay_title.text = "Arrow Space Shift"
		overlay_body.text = "Recover three drive parts. Select Begin flight. Then hold Space to fire." if index == -1 else "Resume %s. Your saved section and recovered parts remain available." % str(chapter.get("name", "flight"))
		if index >= 18 and has_all_parts and not practice:
			overlay_body.text = "Resume %s. You keep your saved parts and records." % str(chapter.get("name", "flight"))
		primary.text = "Begin flight" if index == -1 else "Resume saved section"
		if index == -1:
			if guided:
				overlay_body.text = "Recover three drive parts. Select Begin flight. Watch for the enemy shot."
				overlay_note.text = STEERING_CONTROLS
			else:
				overlay_note.text = "Left Shift folds space. Right Shift unfolds it. Open Guide to compare what happens to both shots."
	elif phase == "paused":
		overlay_title.text = "Flight paused"
		overlay_body.text = "Your flight is held. Open Equipment, Guide, or Options when useful."
		primary.text = "Resume flight"
	elif phase == "lost":
		overlay_title.text = "Hull lost"
		var recap: Dictionary = state.get("deathRecap") if state.get("deathRecap") is Dictionary else {}
		overlay_body.text = str(recap.get("title", "Hull damage")) + ". Retry with full hull in the same layout."
		primary.text = "Retry section"
	elif phase == "cleared":
		overlay_title.text = "Section complete"
		overlay_body.text = _clear_result_text()
		primary.text = "Retry practice" if state.get("practice", false) else "Continue flight"
	elif phase == "won":
		var complete: bool = index == 26 and bool(profile.get("curvatureSeed", false))
		var next_act: String = "Klein Relay saved. The Relay lets your ship cross joined edges in Act II." if index == 8 else "Projective Module saved. Use C to capture shots and E to release echoes in Act III."
		overlay_title.text = "Practice complete" if practice else "Act III complete" if complete else "Part extracted"
		overlay_body.text = "This practice does not bank a permanent part. Use Practice to return to your campaign." if practice else "The Curvature Seed is banked. Your recovered parts and records remain saved. Thank you for playing Arrow Space Shift." if complete else next_act
		primary.text = "Retry practice" if practice else "Replay Act III" if complete else "Continue to Act %d" % (3 if index == 17 else 2)
		if complete and not practice:
			if has_all_parts:
				overlay_body.text = "The Curvature Seed is saved. The Relay lets you cross joined edges. The Module turns hostile shots into echoes."
			overlay_note.text = "Acts I–III · Recovered parts are saved"
	_show_flight_result()
	flight_view.queue_redraw()
	if state.get("projective") is Dictionary and not state.projective.get("offers", []).is_empty() and not is_instance_valid(modal) and not is_instance_valid(splash):
		_open_menu("evolution")

func _recent_echo_action() -> String:
	var events: Array = state.get("events", [])
	var now: float = float(state.get("time", 0))
	for index in range(events.size() - 1, -1, -1):
		var event: Dictionary = events[index]
		if event.get("type") == "chapter-start" or now - float(event.get("time", 0)) > 0.85:
			break
		match event.get("type", ""):
			"echo-captured": return " · Captured"
			"echo-released": return " · Released"
	return ""

func _current_notice() -> String:
	var campaign: Dictionary = state.get("campaign", {})
	if state.get("phase", "") == "won":
		if state.get("practice", false):
			return "Practice complete."
		if int(campaign.get("index", -1)) == 26 and state.get("fleetProfile", {}).get("curvatureSeed", false):
			return "Curvature Seed banked. Act III complete."
		return "Part banked. Continue to the next Act."
	var warning_until: Variant = state.get("drive", {}).get("warningUntil")
	if warning_until != null and float(warning_until) > float(state.get("time", 0)):
		return "Drive fault: space will fold. Right Shift removes the latest fold."
	if campaign.get("bossPhase", "") == "salvage":
		return "Collect the part. Reach extraction to save it."
	if campaign.get("bossPhase", "") == "exit":
		return "Part aboard. Survive departure to save the recovered part."
	if int(campaign.get("index", -1)) == -1:
		return _first_contact_notice(campaign)
	return str(state.get("lastEvent", state.get("chapter", {}).get("goal", "Reach the route exit.")))

func _update_tutorial_prompt(prompt: String, training: Dictionary) -> void:
	var text := ""
	var show_prompt: bool = not prompt.is_empty() and not is_instance_valid(splash) and not is_instance_valid(modal) and not qa_clip_active
	if show_prompt:
		var copy: Array[String] = _tutorial_prompt_copy(prompt, training)
		show_prompt = not copy.is_empty()
		if show_prompt:
			tutorial_prompt_action.text = copy[0]
			tutorial_prompt_detail.text = copy[1]
			text = "Flight held. %s. %s" % copy
	tutorial_prompt.visible = show_prompt
	_place_tutorial_prompt()
	if text != tutorial_prompt_text:
		tutorial_prompt_text = text
		if is_instance_valid(bridge):
			bridge.eval("window.arrowGodotAnnouncePrompt?.(" + JSON.stringify(text) + ");", true)

func _tutorial_prompt_shot_point() -> Variant:
	if not tutorial_prompt.visible or not last_tutorial_hold_prompt in ["dodge-left", "dodge-right", "unfold"]:
		return null
	var shot_id: String = state.campaign.training.get("promptShot", "")
	if shot_id.is_empty():
		return null
	for shot in state.get("enemyShots", []):
		if shot.get("objectId", "") == shot_id and not shot.get("dead", false):
			var arena: Dictionary = flight_view.layout()
			var point: Vector2 = flight_view.project(float(shot.get("x", 0)), float(shot.get("z", 0)))
			if Rect2(arena.left, arena.top, arena.width, arena.height).has_point(point):
				return point
			return null
	return null

func _place_tutorial_prompt() -> void:
	var offset := 0.0
	var point: Variant = _tutorial_prompt_shot_point()
	if point is Vector2:
		var flight_size: Vector2 = flight_view.size
		var card_size: Vector2 = tutorial_prompt.size
		var card := Rect2(((flight_size - card_size) * 0.5).floor(), card_size)
		const MARKER_CLEARANCE := 8.0
		if card.grow(MARKER_CLEARANCE).has_point(point):
			var above: float = floorf(point.y - MARKER_CLEARANCE - card.end.y)
			var below: float = ceilf(point.y + MARKER_CLEARANCE - card.position.y)
			var nearest: float = above if absf(above) <= below else below
			var limit: float = floorf(maxf(0.0, minf(flight_size.y * 0.2, card.position.y)))
			offset = clampf(nearest, -limit, limit)
	tutorial_prompt_center.offset_top = offset
	tutorial_prompt_center.offset_bottom = offset

func _tutorial_prompt_copy(prompt: String, training: Dictionary) -> Array[String]:
	match prompt:
		"dodge-left", "dodge-right":
			var left: bool = prompt == "dodge-left"
			var arrow: String = "Left Arrow" if left else "Right Arrow"
			var alternatives: String = "Home or number pad 4" if left else "End or number pad 6"
			var action: String = "leftPressed" if left else "rightPressed"
			if _flight_action_held(action):
				return ["Release the steering keys", "Press %s, %s." % [arrow, alternatives]]
			return ["Press %s" % arrow, "Move away from the shot. You can also press %s." % alternatives]
		"fire":
			if held.get(KEY_SPACE, false):
				return ["Release Space", "Press Space again to fire."]
			return ["Press Space", "Fire at the enemy."]
		"fold":
			if training.get("shiftStep", 0) == 1:
				return ["Press Left Shift", "Restore the fold to continue. Shots fired %d/2." % training.get("foldedShots", 0)]
			return ["Press Left Shift", "Fold space. Shots move faster for both ships. Fire twice in the fold."]
		"unfold":
			return ["Press Right Shift", "Remove the last fold for more time to steer."]
	return []

func _fold_exercise_notice(training: Dictionary) -> String:
	var shots: int = int(training.get("foldedShots", 0))
	if shots >= 2:
		return "Shots fired in the fold. 2/2\nReduce target hull to 25%."
	var enemies: Array = state.get("enemies", [])
	var target_at_limit: bool = not enemies.is_empty() and float(enemies[0].get("hp", 8)) <= 2.0
	var detail: String = "Target hull stays at 25%." if target_at_limit else "Hold Space to fire."
	return "Fire two shots in the fold. %d/2\n%s" % [shots, detail]

func _first_contact_notice(campaign: Dictionary) -> String:
	if campaign.get("lesson") == "complete":
		return "First contact clear. Entering Two Sides."
	var training: Dictionary = campaign.get("training", {})
	var phase: String = str(state.get("phase", ""))
	var guided: bool = bool(training.get("guided", true))
	if guided and phase in ["ready", "paused"]:
		return ""
	if guided and phase == "running":
		if training.get("shiftStep", 0) == 1:
			return _fold_exercise_notice(training)
		match training.get("prompt", ""):
			"dodge-left": return "Move left to go away from the shot."
			"dodge-right": return "Move right to go away from the shot."
			"line-up": return "Move left or right to line up with the enemy."
			"fire": return "Hold Space to fire."
			"finish": return "Space is open. Enemy shots move at their usual speed. Hold Space to finish." if state.get("fields", []).is_empty() else "One fold removed. Hold Space to finish."
			"": return "Watch for the enemy shot."
	if not state.get("fields", []).is_empty():
		return "Shots from both ships move faster in the fold. Use Right Shift to remove the last fold for more time to steer."
	if training.get("unfolded", false):
		return "Space is open. Shots move at their usual speed. Left Shift folds space again."
	if training.get("prompt", "") == "skipped":
		return "Guidance skipped. Hold Space to clear the first contact."
	return FIRST_CONTACT_FOLD_HINT

func _skip_guidance() -> void:
	Campaign.skip_tutorial_guidance(state)
	_update_ui()

func _clear_result_text() -> String:
	var grade: Dictionary = state.get("campaign", {}).get("grade", {})
	var text: String = "Score %s" % str(state.get("score", 0))
	if not grade.is_empty():
		text += " · Combat %s (%d/100)" % [str(grade.get("letter", "—")), int(grade.get("score", 0))]
	var speed: Variant = grade.get("speed")
	if speed is Dictionary:
		var elapsed: float = float(speed.get("elapsed", 0))
		var saved: float = maxf(0.0, float(speed.get("reference", elapsed)) - elapsed)
		text += "\nTime %.1f s · Speed %s\n%.1f s saved · +%d points" % [elapsed, str(speed.get("letter", "—")), saved, int(speed.get("bonus", 0))]
	return text + "."

func _primary_action() -> void:
	if is_instance_valid(modal) or is_instance_valid(splash):
		return
	var phase: String = str(state.get("phase", "ready"))
	if phase in ["ready", "paused"]:
		state.phase = "running"
		state.restoredCheckpoint = false
	elif phase == "lost":
		simulation.retry(state)
		state.phase = "running"
		flight_view.reset_motion()
	elif phase in ["cleared", "won"]:
		if state.get("practice", false):
			simulation.retry(state)
			state.phase = "running"
			flight_view.reset_motion()
		else:
			_advance()
	held.clear()
	pressed.clear()
	primary.release_focus()
	_save()
	_update_ui()

func _advance() -> void:
	var selected: int = int(state.get("fleetProfile", {}).get("selectedShip", state.get("shipId", 0)))
	if state.get("fleetProfile", {}).get("unlockedShips", [0]).has(selected):
		state.shipId = selected
	if int(state.get("campaign", {}).get("index", -1)) == 26 and state.get("phase", "") == "won" and bool(state.get("fleetProfile", {}).get("curvatureSeed", false)):
		state.localRankId = ""
		simulation.enter_chapter(state, 18)
		state.phase = "running"
	else:
		simulation.continue_campaign(state)
	flight_view.reset_motion()
	clear_time = 0.0
	_save()
	_update_ui()

func _new_run() -> void:
	var profile: Dictionary = state.get("fleetProfile", {}).duplicate(true)
	if not practice_return.is_empty():
		profile = practice_return.get("fleetProfile", {}).duplicate(true)
	practice_return.clear()
	state = simulation.create_flight({"fleetProfile": profile})
	state.localRankId = Leaderboard.new_run_id()
	state.phase = "running"
	flight_view.state = state
	flight_view.reset_motion()
	held.clear()
	pressed.clear()
	_save()
	_update_ui()

func _toggle_pause() -> void:
	if is_instance_valid(splash) or is_instance_valid(modal):
		return
	if state.get("phase", "") == "running":
		state.phase = "paused"
	elif state.get("phase", "") == "paused":
		state.phase = "running"
	held.clear()
	pressed.clear()
	if state.get("phase", "") == "running":
		get_viewport().gui_release_focus()
	_update_ui()

func _on_focus_lost() -> void:
	held.clear()
	pressed.clear()
	if state.get("phase", "") == "running":
		if Campaign.tutorial_hold_prompt(state).is_empty():
			state.phase = "paused"
		_update_ui()

func _toggle_sound() -> void:
	preferences.sound = not bool(preferences.get("sound", true))
	audio.set_preferences(preferences)
	_save()
	_update_ui()

func _open_menu(kind: String) -> void:
	if is_instance_valid(splash) or is_instance_valid(modal):
		return
	if state.get("phase", "") == "running":
		state.phase = "paused"
	held.clear()
	pressed.clear()
	modal_kind = kind
	modal = Window.new()
	modal.name = "GameDialog"
	modal.title = kind.capitalize()
	modal.transient = true
	modal.exclusive = true
	modal.unresizable = false
	modal.theme = theme
	if kind == "leaderboard":
		modal.theme = theme.duplicate()
		var native_frame: StyleBox = ThemeDB.get_default_theme().get_stylebox("embedded_border", "Window")
		var frame: StyleBoxFlat = native_frame.duplicate() if native_frame is StyleBoxFlat else _panel_style()
		frame.bg_color = Color("0c151c")
		frame.border_color = Color("806e4b")
		modal.theme.set_stylebox("embedded_border", "Window", frame)
		modal.theme.set_stylebox("embedded_unfocused_border", "Window", frame)
	modal.close_requested.connect(_close_menu)
	add_child(modal)
	var dialog_input := DialogInput.new()
	dialog_input.cancelled.connect(_close_menu)
	modal.add_child(dialog_input)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for edge in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + edge, 18)
	modal.add_child(margin)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	margin.add_child(column)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	column.add_child(scroll)
	var content := VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 12)
	scroll.add_child(content)
	match kind:
		"equipment": _equipment_content(content)
		"practice": _practice_content(content)
		"options": _options_content(content)
		"evolution": _evolution_content(content)
		"leaderboard": _leaderboard_content(content)
		_: _guide_content(content)
	column.add_child(_button("Close", _close_menu))
	_resize()
	modal.popup_centered(modal.size)
	_resize()
	overlay.visible = false

func _close_menu() -> void:
	if not is_instance_valid(modal):
		return
	modal.hide()
	modal.queue_free()
	modal = null
	modal_kind = ""
	held.clear()
	pressed.clear()
	_update_ui()

func _paragraph(parent: Node, value: String, color: Color = Color("d5dfe0")) -> Label:
	var label: Label = _label(value, 15)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_color_override("font_color", color)
	parent.add_child(label)
	return label

func _leaderboard_content(content: VBoxContainer) -> void:
	_paragraph(content, "Top 10 on this device · Best score per campaign", Color("edce87"))
	if leaderboard.is_empty():
		_paragraph(content, "End a campaign flight to record its score.")
		return
	var chapters: Array = Data.get_data().chapters
	for index in leaderboard.size():
		var entry: Dictionary = leaderboard[index]
		var panel := PanelContainer.new()
		var row_style := StyleBoxFlat.new()
		row_style.bg_color = Color("151f24") if index % 2 == 0 else Color("10191e")
		row_style.border_color = Color("806e4b") if index == 0 else Color("394b50")
		row_style.border_width_left = 2
		row_style.content_margin_left = 9
		row_style.content_margin_right = 9
		row_style.content_margin_top = 7
		row_style.content_margin_bottom = 7
		panel.add_theme_stylebox_override("panel", row_style)
		content.add_child(panel)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		panel.add_child(row)
		var place := _label(str(index + 1).pad_zeros(2), 15)
		place.add_theme_color_override("font_color", Color("edce87"))
		row.add_child(place)
		var chapter_name: String = "First Contact" if entry.chapter == -1 else chapters[entry.chapter].name
		var context: String = "Act III complete" if entry.complete else chapter_name
		var label := _paragraph(row, context)
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var score_label := _label(str(entry.score), 18)
		score_label.add_theme_color_override("font_color", Color("f7ebc7"))
		row.add_child(score_label)

func _show_flight_result() -> void:
	var result := Leaderboard.outcome(state)
	flight_result.visible = not result.is_empty()
	overlay_note.visible = flight_view.size.y >= 400 and result.is_empty()
	if result.is_empty():
		shown_result.clear()
		return
	if result == shown_result:
		return
	shown_result = result
	var rank_text := "Practice score" if state.get("practice", false) else "Unranked flight score"
	if not state.get("practice", false) and Leaderboard.valid_id(result.id):
		var before := leaderboard
		leaderboard = Leaderboard.clean(leaderboard + [result])
		var position := Leaderboard.position(leaderboard, result.id)
		rank_text = "Outside the local top 10"
		if position > 0:
			var best: Dictionary = leaderboard[position - 1]
			rank_text = "Local rank %d" % position
			if best.score != result.score:
				rank_text += " · Campaign best %d" % int(best.score)
			elif leaderboard != before and position == 1:
				rank_text += " · New record"
		if leaderboard != before and not qa and not _save():
			rank_text = "Session score · Save unavailable"
	flight_result.show_score(result, rank_text, preferences.get("juice", true) and not preferences.get("reducedMotion", false))

func _guide_content(content: VBoxContainer) -> void:
	_paragraph(content, "Recover three repair parts. Defeat each boss, collect the physical part, and survive departure to save it.")
	_paragraph(content, STEERING_CONTROLS)
	_paragraph(content, "Hold Space to fire. Left Shift folds. Right Shift unfolds. P pauses.")
	var fold_example := FoldExample.new()
	fold_example.reduced_motion = bool(preferences.get("reducedMotion", false))
	content.add_child(fold_example)
	_paragraph(content, "A filled hostile core is live. An open blue cage means a hold. It can still cause contact damage.")
	_paragraph(content, "Trailing squares show fold depth. A small side mark follows orientation through a reflecting join. Border shapes identify the shared edge rules.")
	_paragraph(content, "A broken orange arc marks damage due. Green conversion marks mean capture or Ward. Small grey fragments mean completed travel.")
	_paragraph(content, "Player shots complete 3400 physical units. Hostile shots complete 1020. Holds and position jumps spend no travel. A fold makes both sides travel faster.")
	_paragraph(content, "Source preparation shows when an attack is forming. Follow actual shots. No target line or future return marker is shown.")
	_paragraph(content, "The fixed circle marks the collision core. Ship bank and exhaust are decorative.")
	_paragraph(content, "The accepted side changes with fold count. Equipment acts in slot order. Stored damage remains a later threat.")
	_paragraph(content, "Act II uses identified edge joins. Returning enemies keep their identity, health, and equipment.")
	_paragraph(content, "Act III adds deliberate capture and release. C captures nearby hostile shots. E spends stored echoes.")
	_paragraph(content, "Green chevrons mark the shots you can capture now.")
	_paragraph(content, "The jam edition ends after Curvature Seed extraction in Act III. The later source remains outside this edition.")
	_operation_guide(content)
	_paragraph(content, "Native Godot candidate · " + str(ProjectSettings.get_setting("application/config/version", "")), Color("879da4"))

func _operation_guide(content: VBoxContainer) -> void:
	var definitions: Dictionary = Data.get_data()
	var operations: Array = definitions.get("operations", [])
	var axes: Array = definitions.get("effectAxes", [])
	_paragraph(content, "Operation inspection", Color("f0e4bd"))
	_paragraph(content, "Select an operation to inspect its position, distance, path, velocity, arrival time, damage, and utility effects.")
	var selection := OptionButton.new()
	selection.name = "OperationInspection"
	selection.fit_to_longest_item = false
	selection.clip_text = true
	selection.custom_minimum_size.y = 36
	for operation in operations:
		selection.add_item(str(operation.get("code", "")) + " · " + str(operation.get("name", "")), int(operation.get("id", 0)))
	content.add_child(selection)
	var details := VBoxContainer.new()
	details.name = "OperationEffects"
	details.add_theme_constant_override("separation", 9)
	content.add_child(details)
	var inspect: Callable = func(index: int):
		for child in details.get_children():
			child.queue_free()
		if index < 0 or index >= operations.size():
			return
		var operation: Dictionary = operations[index]
		var name_label: Label = _paragraph(details, str(operation.get("code", "")) + " · " + str(operation.get("name", "")), Color("f0e4bd"))
		name_label.name = "OperationName"
		var effects: Array = operation.get("effects", [])
		for i in range(mini(axes.size(), effects.size())):
			var row: Label = _paragraph(details, str(axes[i]) + ": " + str(effects[i]))
			row.name = "EffectAxis" + str(i)
	selection.item_selected.connect(inspect)
	inspect.call(0)
	_paragraph(content, "Counter inspection", Color("f0e4bd"))
	_paragraph(content, "Select defense operations. The result lists operations that counter every selected defense. This graph does not establish combat balance.")
	var stage := OptionButton.new()
	stage.name = "CounterRoster"
	stage.fit_to_longest_item = false
	stage.clip_text = true
	stage.add_item("Three operations", 1)
	stage.add_item("Seven operations", 2)
	stage.selected = 1
	stage.custom_minimum_size.y = 36
	content.add_child(stage)
	var defense_a := OptionButton.new()
	defense_a.name = "DefenseA"
	defense_a.fit_to_longest_item = false
	defense_a.clip_text = true
	defense_a.custom_minimum_size.y = 36
	content.add_child(defense_a)
	var defense_b := OptionButton.new()
	defense_b.name = "DefenseB"
	defense_b.fit_to_longest_item = false
	defense_b.clip_text = true
	defense_b.custom_minimum_size.y = 36
	content.add_child(defense_b)
	var result: Label = _paragraph(content, "")
	result.name = "CommonCounters"
	var graph: Label = _paragraph(content, "", Color("a7b8bd"))
	graph.name = "CounterGraph"
	var update_counters: Callable = func(_index: int = 0):
		var roster: int = stage.get_selected_id()
		var selected: Array = [defense_a.get_selected_id()]
		if roster == 2 and defense_b.get_selected_id() < operations.size() and not selected.has(defense_b.get_selected_id()):
			selected.append(defense_b.get_selected_id())
		var matches: Array = OperationsGuide.common_counters(selected, roster)
		var names: Array[String] = []
		for identity in matches:
			names.append(str(operations[int(identity)].get("code", "")) + " · " + str(operations[int(identity)].get("name", "")))
		result.text = "Common counters: " + (" / ".join(names) if not names.is_empty() else "None in this roster.")
		var rows: Array[String] = []
		for identity in OperationsGuide.roster(roster):
			var targets: Array[String] = []
			for target in OperationsGuide.roster(roster):
				if OperationsGuide.counters(int(identity), int(target)):
					targets.append(str(operations[int(target)].get("code", "")))
			rows.append(str(operations[int(identity)].get("code", "")) + " counters " + ", ".join(targets))
		graph.text = "\n".join(rows)
	var change_roster: Callable = func(_index: int = 0):
		defense_a.clear()
		defense_b.clear()
		defense_b.add_item("No second defense", 99)
		var roster: int = stage.get_selected_id()
		for identity in OperationsGuide.roster(roster):
			var operation: Dictionary = operations[int(identity)]
			var label: String = str(operation.get("code", "")) + " · " + str(operation.get("name", ""))
			defense_a.add_item("A: " + label, int(identity))
			defense_b.add_item("B: " + label, int(identity))
		defense_a.selected = 0
		defense_b.selected = 2 if roster == 2 else 0
		defense_b.visible = roster == 2
		update_counters.call()
	defense_a.item_selected.connect(update_counters)
	defense_b.item_selected.connect(update_counters)
	stage.item_selected.connect(change_roster)
	change_roster.call()

func _equipment_content(content: VBoxContainer) -> void:
	_paragraph(content, "Equipment acts in order: Slot 1, then Slot 2. Each operation uses its retained side.")
	var operations: Array = Data.get_data().get("operations", [])
	var equipped: Array = state.get("equipped", [null, null])
	for slot in range(int(state.get("slotCount", 1))):
		var seed: Variant = equipped[slot] if slot < equipped.size() else null
		var name: String = "Empty" if not seed is Dictionary else str(operations[int(seed.get("type", 0))].get("name", "Operation"))
		_paragraph(content, "Slot %d: %s" % [slot + 1, name], Color("f0e4bd"))
	for seed in state.get("inventory", []):
		var row := HFlowContainer.new()
		content.add_child(row)
		var operation: Dictionary = operations[int(seed.get("type", 0))]
		row.add_child(_label(("Right " if int(seed.get("polarity", 1)) == 1 else "Left ") + str(operation.name), 14))
		for slot in range(int(state.get("slotCount", 1))):
			var index: int = slot
			var key: String = str(seed.get("key", ""))
			row.add_child(_button("Slot %d" % (slot + 1), func():
				var ops: GDScript = load("res://scripts/upgrades.gd")
				ops.equip_seed(state, key, index)
				_save()
				_close_menu()
				_open_menu("equipment")))
	if state.get("inventory", []).is_empty():
		_paragraph(content, "Your first operation drops during the scrolling campaign.")
	_paragraph(content, "Ships", Color("f0e4bd"))
	_paragraph(content, "Choose a ship for the next section. Your active hull stays fixed during this section.")
	var profile: Dictionary = state.get("fleetProfile", {})
	for ship in Data.get_data().get("ships", []):
		if not profile.get("unlockedShips", [0]).has(int(ship.id)):
			continue
		var id: int = int(ship.id)
		var button: Button = _button(str(ship.name) + " · " + str(ship.get("role", "")), func():
			Fleet.select_ship(state.fleetProfile, id)
			if state.get("phase", "") == "ready" and not bool(state.get("restoredCheckpoint", false)):
				state.shipId = id
				flight_view.reset_motion()
			_save()
			_close_menu())
		content.add_child(button)
		_paragraph(content, str(ship.get("strength", "")) + " " + str(ship.get("weakness", "")), Color("96a9b0"))
	var foundry: Dictionary = Fleet.fabrication_status(profile)
	_paragraph(content, "Salvage %d/%d · Aftwing cost %d" % [int(foundry.get("available", 0)), int(foundry.get("earned", 0)), int(foundry.get("cost", 5))])
	var craft: Button = _button("Aftwing constructed" if foundry.get("crafted", false) else "Construct Aftwing", func():
		Fleet.craft_aftwing(state.fleetProfile)
		_save()
		_close_menu()
		_open_menu("equipment"))
	craft.disabled = not foundry.get("blueprint", false) or foundry.get("crafted", false) or int(foundry.get("available", 0)) < int(foundry.get("cost", 5))
	content.add_child(craft)

func _practice_content(content: VBoxContainer) -> void:
	_paragraph(content, "Practice a reached section. Practice does not award a new permanent repair part.")
	if not practice_return.is_empty():
		content.add_child(_button("Return to campaign", _return_from_practice))
	var reached: Array = state.get("fleetProfile", {}).get("reachedChapters", [])
	var chapters: Array = Data.get_data().get("chapters", [])
	for value in reached:
		var index: int = int(value)
		if index < 0 or index >= chapters.size() or index > 26:
			continue
		content.add_child(_button(str(chapters[index].get("name", "Section")), func():
			_close_menu()
			if practice_return.is_empty():
				practice_return = state.duplicate(true)
			state = simulation.create_flight({"fleetProfile": practice_return.fleetProfile})
			simulation.enter_chapter(state, index)
			state.practice = true
			state.phase = "running"
			flight_view.state = state
			flight_view.reset_motion()
			_update_ui()))
	if reached.is_empty():
		_paragraph(content, "Reach a section in the campaign to make it available here.")
	for entry in state.get("fleetProfile", {}).get("runHistory", []).slice(0, 8):
		_paragraph(content, "%s · %s · %s · Score %s" % [str(entry.get("name", "Section")), str(entry.get("result", "")), str(entry.get("grade", "")), str(entry.get("score", 0))], Color("96a9b0"))

func _return_from_practice() -> void:
	_close_menu()
	if practice_return.is_empty():
		return
	state = practice_return
	practice_return = {}
	state.phase = "paused"
	flight_view.state = state
	flight_view.reset_motion()
	_save()
	_update_ui()

func _options_content(content: VBoxContainer) -> void:
	for entry in [["Sound", "sound"], ["Music", "music"], ["Decorative effects", "juice"], ["Reduced motion", "reducedMotion"], ["Collision core", "showCore"], ["Attack labels", "patternLabels"], ["Crossing marks", "manifoldCues"]]:
		var key: String = entry[1]
		var checkbox := CheckBox.new()
		checkbox.text = entry[0]
		checkbox.button_pressed = bool(preferences.get(key, true if key != "reducedMotion" else false))
		checkbox.toggled.connect(func(value: bool):
			preferences[key] = value
			audio.set_preferences(preferences)
			_save()
			_update_ui())
		content.add_child(checkbox)
	for entry in [["Master", "volume"], ["Music level", "musicVolume"], ["Effects", "effectsVolume"], ["Atmosphere", "ambienceVolume"]]:
		var key: String = entry[1]
		var row := HBoxContainer.new()
		content.add_child(row)
		var label: Label = _label(entry[0], 14)
		label.custom_minimum_size.x = 112
		row.add_child(label)
		var slider := HSlider.new()
		slider.min_value = 0
		slider.max_value = 1
		slider.step = 0.01
		slider.value = float(preferences.get(key, 0.5))
		slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		slider.value_changed.connect(func(value: float):
			preferences[key] = value
			audio.set_preferences(preferences)
			_save())
		row.add_child(slider)
	_paragraph(content, "Progress transfer", Color("f0e4bd"))
	_paragraph(content, "Copy the complete progress JSON between the browser game and this port. Existing browser data is not read automatically.")
	content.add_child(_button("Import progress JSON", func(): _progress_dialog(true)))
	content.add_child(_button("Export progress JSON", func(): _progress_dialog(false)))
	_paragraph(content, "Local source and assets retain their production records. No source license has been selected.", Color("879da4"))

func _progress_dialog(importing: bool) -> void:
	_close_menu()
	_open_menu("transfer")
	var column: VBoxContainer = modal.get_child(1).get_child(0)
	var scroll: ScrollContainer = column.get_child(0)
	var content: VBoxContainer = scroll.get_child(0)
	for child in content.get_children():
		child.queue_free()
	modal.title = "Import progress" if importing else "Export progress"
	_paragraph(content, "Paste the complete progress JSON." if importing else "Select and copy the complete progress JSON.")
	var text := TextEdit.new()
	text.custom_minimum_size = Vector2(0, 220)
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	text.editable = importing
	if not importing:
		text.text = store.export_progress(state, preferences)
	content.add_child(text)
	var result: Label = _paragraph(content, "")
	if importing:
		content.add_child(_button("Import", func():
			var imported: Dictionary = store.import_progress(text.text, leaderboard)
			if not imported.get("ok", false):
				result.text = str(imported.get("error", "The progress data could not load."))
				return
			var loaded_state: Dictionary = imported.get("state", {})
			if loaded_state.is_empty():
				result.text = "The progress data contains no usable campaign state."
				return
			state = loaded_state
			state.phase = "ready"
			preferences.merge(imported.get("preferences", {}), true)
			audio.set_preferences(preferences)
			flight_view.state = state
			flight_view.reset_motion()
			_save()
			_close_menu()))
	else:
		content.add_child(_button("Select all", func(): text.grab_focus(); text.select_all()))
	text.grab_focus()

func _evolution_content(content: VBoxContainer) -> void:
	var projective: Dictionary = state.get("projective", {})
	_paragraph(content, "Choose one effect. Stored echoes: %d/%d. This choice spends no echoes." % [projective.get("echoes", 0), projective.get("capacity", 6)])
	for offer in projective.get("offers", []):
		var id: String = str(offer.get("id", "")) if offer is Dictionary else str(offer)
		var definition: Dictionary = {}
		for evolution in Data.get_data().get("evolutions", []):
			if evolution.get("id", "") == id:
				definition = evolution
		var key: String = id
		content.add_child(_button(str(definition.get("name", id)), func():
			if simulation.has_method("choose_evolution"):
				simulation.choose_evolution(state, key)
			_save()
			_close_menu()))
		_paragraph(content, str(definition.get("description", "")))

func _save() -> bool:
	if qa or not is_instance_valid(store) or state.is_empty():
		return false
	if state.get("practice", false):
		if not practice_return.is_empty():
			return store.save_game(practice_return, preferences, leaderboard)
		return false
	return store.save_game(state, preferences, leaderboard)

func _sync_profile() -> void:
	if state.get("practice", false) or not state.get("fleetProfile") is Dictionary:
		return
	var campaign: Dictionary = state.get("campaign", {})
	var index: int = int(campaign.get("index", -1))
	if index >= 0:
		Fleet.mark_chapter_reached(state.fleetProfile, index)
	var phase: String = str(state.get("phase", ""))
	if phase == "running":
		recorded_receipt = ""
	if not phase in ["cleared", "won", "lost"] or index < 0:
		return
	var receipt: String = "%s:%d:%s:%d" % [str(state.get("runSeed", 0)), index, phase, roundi(float(state.get("time", 0)) * 1000)]
	if receipt == recorded_receipt:
		return
	var grade: Dictionary = campaign.get("grade", {})
	if grade.is_empty():
		grade = Campaign.stage_grade(state, state.get("chapter", {}))
	Fleet.record_stage_result(state.fleetProfile, {"chapter": index, "name": state.get("chapter", {}).get("name", "Section"), "result": phase,
		"grade": grade, "score": int(state.get("score", 0)), "grazes": int(campaign.get("metrics", {}).get("grazes", 0)),
		"shipId": state.get("shipId", 0), "runSeed": state.get("runSeed", 0), "time": maxf(0, float(state.get("time", 0)) - float(campaign.get("startedAt", 0))),
		"cause": str(state.get("deathRecap", {}).get("title", "")) if state.get("deathRecap") is Dictionary else "", "receipt": receipt})
	recorded_receipt = receipt

func diagnostic() -> Dictionary:
	var body: Dictionary = simulation.read(state) if simulation and not state.is_empty() else {}
	body.erase("localRankId")
	body["leaderboard"] = {"scores": leaderboard.map(func(entry): return {"score": entry.score, "chapter": entry.chapter, "complete": entry.complete}),
		"visible": flight_result.is_visible_in_tree(), "score": flight_result.score_reading.text, "rank": flight_result.rank_reading.text,
		"reveal": flight_result.track.reveal}
	body["screen"] = "splash" if is_instance_valid(splash) else "modal" if is_instance_valid(modal) else "entry" if state.get("phase", "") == "ready" else "flight"
	body["nativeEngine"] = "Godot " + Engine.get_version_info().string
	body["nativeVersion"] = ProjectSettings.get_setting("application/config/version", "")
	body["qa"] = qa
	body["modal"] = modal_kind if is_instance_valid(modal) else ""
	body["preferences"] = preferences.duplicate(true)
	body["presentation"] = {"bank": flight_view.bank, "wakeSamples": flight_view.wake.size(), "engineGain": flight_view.engine_gain, "collisionOffset": 0, "predictiveAttackGuidance": false, "actualCrossingMarks": true}
	body["performance"] = {"fps": Engine.get_frames_per_second(), "processMs": Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0, "physicsMs": Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0, "framesDrawn": Engine.get_frames_drawn()}
	body["viewport"] = {"width": size.x, "height": size.y, "fieldWidth": flight_view.size.x, "fieldHeight": flight_view.size.y}
	var arena: Dictionary = flight_view.layout()
	var arena_origin: Vector2 = flight_view.global_position + Vector2(arena.left, arena.top)
	body["arena"] = {"x": arena_origin.x, "y": arena_origin.y, "width": arena.width, "height": arena.height, "clipped": flight_view.arena_clip.clip_contents}
	if qa:
		body["clipFixture"] = qa_clip_active
	var prompt_rect: Rect2 = tutorial_prompt.get_global_rect()
	var marked_shot: Variant = _tutorial_prompt_shot_point()
	var protected_point: Variant = null
	if marked_shot is Vector2:
		var world_point: Vector2 = flight_view.get_global_transform() * marked_shot
		protected_point = {"x": world_point.x, "y": world_point.y}
	body["hud"] = {"status": status.text, "readings": readings.text, "information": information.text,
		"notice": tutorial_prompt_text if tutorial_prompt.visible else notice.text,
		"tutorialPrompt": {"visible": tutorial_prompt.is_visible_in_tree(), "text": tutorial_prompt_text,
			"rect": {"x": prompt_rect.position.x, "y": prompt_rect.position.y, "width": prompt_rect.size.x, "height": prompt_rect.size.y},
			"fontSize": tutorial_prompt_action.get_theme_font_size("font_size"), "protectedPoint": protected_point}}
	body["ui"] = []
	_collect_ui(self, body.ui)
	if is_instance_valid(audio) and audio.has_method("diagnostic"):
		body["audio"] = audio.diagnostic()
	return body

func _collect_ui(node: Node, result: Array) -> void:
	if node is Control and node.is_visible_in_tree() and (node is Button or node is HSlider or node is TextEdit):
		var rect: Rect2 = node.get_global_rect()
		if is_instance_valid(modal) and node.get_window() == modal:
			rect.position += Vector2(modal.position)
		var item: Dictionary = {"type": node.get_class(), "x": rect.position.x, "y": rect.position.y, "width": rect.size.x, "height": rect.size.y}
		if node is Button:
			item.text = node.text
			item.disabled = node.disabled
		if node is CheckBox:
			item.checked = node.button_pressed
		result.append(item)
	for child in node.get_children():
		_collect_ui(child, result)

func _install_bridge() -> void:
	if not is_instance_valid(bridge):
		return
	bridge.eval("window.arrowGodot = Object.freeze({read: function(){window.__arrowGodotReadRequested=true; return JSON.parse(JSON.stringify(window.arrowGodotState || {}));}});", true)
	if steering_probe_enabled:
		steering_probe_callback = bridge.create_callback(_arm_steering_probe)
		bridge.get_interface("window").__armArrowSteeringProbe = steering_probe_callback
		bridge.eval("window.arrowSteeringProbe = Object.freeze({arm: function(){window.__armArrowSteeringProbe();}, read: function(){return window.__arrowSteeringResult || null;}});", true)
	if qa:
		qa_callback = bridge.create_callback(_qa_command)
		bridge.get_interface("window")["__arrowGodotCommand"] = qa_callback
		bridge.eval("window.arrowGodotTest = Object.freeze({chapter: function(index){window.__arrowGodotCommand(JSON.stringify({action:'chapter',index:index}));}, advance:function(seconds,input){window.__arrowGodotCommand(JSON.stringify({action:'advance',seconds:seconds,input:input||{}}));}, skipSplash:function(){window.__arrowGodotCommand(JSON.stringify({action:'skip-splash'}));}, clipFixture:function(enabled,inside,edge){window.__arrowGodotCommand(JSON.stringify({action:'clip-fixture',enabled:!!enabled,inside:!!inside,edge:!!edge}));}, consequenceFixture:function(kind,reduced){window.__arrowGodotCommand(JSON.stringify({action:'consequence-fixture',kind:kind,reduced:!!reduced}));}});", true)
	_publish_diagnostic(true)

func _arm_steering_probe(_arguments: Array = []) -> void:
	if not steering_probe_enabled:
		return
	steering_probe = {"armed": true}
	flight_view.steering_draw_probe = Callable()
	if is_instance_valid(bridge):
		bridge.eval("window.__arrowSteeringResult = null;", true)

func _steering_drawn() -> void:
	steering_probe.drawnUs = Time.get_ticks_usec()
	steering_probe.drawnX = float(state.x)
	steering_probe.armed = false
	if is_instance_valid(bridge):
		bridge.eval("window.__arrowSteeringResult = " + JSON.stringify(steering_probe) + ";", true)

func _publish_diagnostic(force: bool = false) -> void:
	if is_instance_valid(bridge):
		if not force and not qa and not bool(bridge.eval("window.__arrowGodotReadRequested === true", true)):
			return
		bridge.eval("window.__arrowGodotReadRequested = false;", true)
		bridge.eval("window.arrowGodotState = " + JSON.stringify(diagnostic()) + ";", true)

func _qa_command(arguments: Array) -> void:
	if not qa or arguments.is_empty():
		return
	var command: Variant = JSON.parse_string(str(arguments[0]))
	if not command is Dictionary:
		return
	match str(command.get("action", "")):
		"skip-splash":
			if is_instance_valid(splash):
				splash.finish()
		"chapter":
			qa_clip_active = false
			simulation.enter_chapter(state, clampi(int(command.get("index", -1)), -1, 26))
			state.phase = "running"
			flight_view.reset_motion()
		"advance":
			for step in range(mini(120 * 120, maxi(0, roundi(float(command.get("seconds", 0)) / STEP)))):
				flight_view.acknowledge_visible()
				simulation.tick(state, command.get("input", {}), STEP)
		"clip-fixture":
			_qa_clip_fixture(bool(command.get("enabled", false)), bool(command.get("inside", false)), bool(command.get("edge", false)))
		"consequence-fixture":
			_qa_consequence_fixture(str(command.get("kind", "live")), bool(command.get("reduced", false)))
	_update_ui()
	_publish_diagnostic(true)

func _qa_clip_fixture(enabled: bool, inside: bool = false, edge: bool = false) -> void:
	if not qa:
		return
	if is_instance_valid(splash):
		splash.finish()
	if is_instance_valid(modal):
		_close_menu()
	qa_clip_active = true
	state = simulation.create_flight({"seed": 20261114})
	simulation.enter_chapter(state, 0)
	state.phase = "paused"
	state.time = 10.0
	state.cameraZ = 0.0
	state.z = 0.0
	state.x = 0.0
	for key in ["enemies", "asteroids", "shots", "enemyShots", "drops", "effects", "events", "fields"]:
		state[key] = []
	held.clear()
	pressed.clear()
	flight_view.state = state
	flight_view.reset_motion()
	flight_view.update_motion()
	if enabled:
		var event: Dictionary = {"time": 9.9, "type": "operation", "typeId": 0, "x": 400.0 if edge else 0.0 if inside else -540.0, "z": 500.0}
		state.events.append(event)
	flight_view.queue_redraw()
	flight_view.world_canvas.queue_redraw()

func _qa_consequence_fixture(kind: String, reduced: bool = false) -> void:
	if not qa or not kind in ["live", "depth", "hold", "parity", "debt", "capture", "expiry", "dense", "preparation"]:
		return
	if is_instance_valid(splash):
		splash.finish()
	if is_instance_valid(modal):
		_close_menu()
	qa_clip_active = true
	state = simulation.create_flight({"seed": 20261121})
	simulation.enter_chapter(state, 26 if kind == "capture" else 8)
	state.phase = "paused"
	state.time = 10.0
	state.z = 0.0
	state.x = 0.0
	state.fields = []
	state.events = []
	state.effects = []
	state.shots = []
	state.enemyShots = []
	state.asteroids = []
	state.drops = []
	state.debts = []
	state.enemies = [{"id": 990, "x": 0.0, "z": 760.0, "hp": 10.0, "maxHp": 10.0, "stage": 2, "presented": true, "visibleFor": 1.0}]
	if kind == "depth":
		for index in range(3):
			state.fields.append({"id": index + 1, "start": 300.0 + index * 450.0, "end": 4000.0, "factor": 0.5})
		state.enemies[0].z = Campaign.arena_z(state, 760.0)
	var count: int = 160 if kind == "dense" else 4
	if kind in ["capture", "expiry", "preparation"]:
		count = 0
	for index in range(count):
		var y: float = 180.0 + float(index / 20) * 75.0 if kind == "dense" else 300.0 + index * 100.0
		var x: float = -340.0 + float(index % 20) * 34.0 if kind == "dense" else -210.0 + index * 140.0
		state.enemyShots.append({"x": x, "z": Campaign.arena_z(state, y), "vx": 0.0, "vz": -145.0, "owner": "enemy", "damage": 1.0,
			"hold": 0.65 if kind == "hold" or kind == "dense" and index % 3 == 0 else 0.0,
			"transportParity": index % 2 if kind in ["parity", "dense"] else 0,
			"surfaceCrossings": 1 if kind in ["parity", "dense"] else 0,
			"lastCrossingAt": 9.8 if kind == "parity" else -100.0, "lastCrossing": {"rule": "klein"}})
	if kind == "debt":
		state.debts = [{"target": "player", "amount": 2.0, "due": 10.8}, {"target": 990, "amount": 3.0, "due": 11.2}]
	if kind in ["capture", "expiry"]:
		state.events.append({"type": "projectile-ended", "time": 9.9, "x": 0.0, "z": Campaign.arena_z(state, 420.0), "cause": "capture" if kind == "capture" else "journey-complete"})
	if kind == "preparation":
		state.enemies[0].telegraph = {"duration": 0.65, "remaining": 0.2, "patternName": "PREPARING", "aimX": 220.0, "aimZ": 0.0}
	preferences.reducedMotion = reduced
	preferences.juice = not reduced
	held.clear()
	pressed.clear()
	flight_view.state = state
	flight_view.preferences = preferences
	flight_view.reset_motion()
	flight_view.update_motion()
	flight_view.queue_redraw()
	flight_view.world_canvas.queue_redraw()
