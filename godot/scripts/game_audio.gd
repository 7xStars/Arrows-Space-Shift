extends Node

enum CuePriority { ROUTINE = 1, STORED_DAMAGE, CRITICAL }

const Store = preload("res://scripts/save_store.gd")
var preferences: Dictionary = {}
var music_player: AudioStreamPlayer
var synchronized: AudioStreamSynchronized
var voices: Array[AudioStreamPlayer] = []
var active_track: String = ""
var last_state: Dictionary = {}
var event_cursor: int = 0
var last_time: float = 0.0
var cue_times: Dictionary = {}
var duck_until: float = -1.0
var admitted: int = 0
var dropped: int = 0

func _ready() -> void:
	music_player = AudioStreamPlayer.new()
	music_player.playback_type = AudioServer.PLAYBACK_TYPE_STREAM
	add_child(music_player)
	music_player.finished.connect(_music_finished)
	for index in range(24):
		var voice: AudioStreamPlayer = AudioStreamPlayer.new()
		voice.name = "ActionVoice%s" % index
		add_child(voice)
		voices.append(voice)
	set_preferences(preferences)

func set_preferences(value: Dictionary) -> void:
	preferences = Store.preferences(value)
	if not preferences.sound:
		for voice in voices: voice.stop()
	if music_player != null:
		music_player.volume_linear = preferences.volume if preferences.sound and preferences.music else 0.0

func _select_track(key: String) -> void:
	if key == active_track or music_player == null: return
	music_player.stop()
	active_track = key
	synchronized = null
	if key == "title":
		music_player.stream = load("res://assets/audio/title.ogg")
	else:
		synchronized = AudioStreamSynchronized.new()
		synchronized.stream_count = 2
		synchronized.set_sync_stream(0, load("res://assets/audio/%s-core.ogg" % key))
		synchronized.set_sync_stream(1, load("res://assets/audio/%s-atmosphere.ogg" % key))
		music_player.stream = synchronized
	music_player.play()

func _music_finished() -> void:
	if music_player != null and preferences.get("sound", true) and preferences.get("music", true): music_player.play()

func _cue(name: String, now: float, priority: int = CuePriority.ROUTINE) -> void:
	if not preferences.get("sound", true): return
	var interval: float = 0.09 if name == "player-fire" else 0.12 if name == "enemy-fire" else 0.045
	if now - float(cue_times.get(name, -1000.0)) < interval: return
	var path: String = "res://assets/audio/sfx/%s.wav" % name
	if not ResourceLoader.exists(path): return
	var available: AudioStreamPlayer = null
	var lowest_priority: int = priority
	for voice in voices:
		if not voice.playing:
			available = voice
			break
		var active_priority: int = int(voice.get_meta("cue_priority", CuePriority.ROUTINE))
		if active_priority < lowest_priority:
			available = voice
			lowest_priority = active_priority
	if available == null and priority >= CuePriority.CRITICAL: available = voices[0]
	if available == null:
		dropped += 1
		return
	available.stop()
	available.stream = load(path)
	available.volume_linear = float(preferences.volume) * float(preferences.effectsVolume)
	available.set_meta("cue_priority", priority)
	available.play()
	cue_times[name] = now
	admitted += 1
	if priority >= CuePriority.CRITICAL: duck_until = now + 0.24

func process_state(state: Dictionary) -> void:
	if music_player == null or state.is_empty(): return
	var time: float = float(state.get("time", 0.0))
	var events: Array = state.get("events", [])
	if not is_same(state, last_state) or time < last_time or event_cursor > events.size():
		last_state = state
		event_cursor = 0
		cue_times.clear()
		duck_until = -1.0
	last_time = time
	var phase: String = str(state.get("phase", "ready"))
	var index: int = int(state.get("campaign", {}).get("index", -1))
	var track: String = "title" if phase == "ready" else "act3" if index >= 18 else "act2" if index >= 9 else "act1"
	_select_track(track)
	music_player.stream_paused = phase in ["paused", "lost"] or not preferences.sound or not preferences.music
	music_player.volume_linear = float(preferences.volume) * (0.72 if time < duck_until else 1.0)
	var current_wave = state.get("campaign", {}).get("currentWave")
	var recovery: bool = current_wave is Dictionary and current_wave.get("kind", "") == "break"
	recovery = recovery or float(state.get("campaign", {}).get("phaseBreakUntil", 0)) > time
	if synchronized != null:
		synchronized.set_sync_stream_volume(0, linear_to_db(maxf(0.0001, float(preferences.musicVolume) * (0.16 if recovery or phase == "choosing" else 1.0))))
		synchronized.set_sync_stream_volume(1, linear_to_db(maxf(0.0001, float(preferences.ambienceVolume))))
	else:
		music_player.volume_linear *= float(preferences.musicVolume)
	for index_event in range(event_cursor, events.size()):
		var event: Dictionary = events[index_event]
		if event.get("forecast", false): continue
		var cue: String = str(event.get("type", ""))
		if cue == "klein-crossing" and event.get("actor", "") != "player": continue
		if cue == "pattern-warning": cue = "pattern-" + str(event.get("pattern", event.get("patternName", "aimed"))).to_lower()
		var priority: int = CuePriority.ROUTINE
		if cue in ["damage", "drive-warning", "hybrid-phase", "join-warning"] or cue.begins_with("pattern-"):
			priority = CuePriority.CRITICAL
		elif cue == "damage-debt":
			priority = CuePriority.STORED_DAMAGE
		_cue(cue, time, priority)
	event_cursor = events.size()

func stop() -> void:
	if music_player != null: music_player.stop()
	for voice in voices: voice.stop()
	active_track = ""

func _exit_tree() -> void:
	stop()
	if music_player != null: music_player.stream = null
	for voice in voices: voice.stream = null
	synchronized = null

func diagnostic() -> Dictionary:
	return {"track": active_track, "playing": music_player != null and music_player.playing,
		"paused": music_player != null and music_player.stream_paused, "position": music_player.get_playback_position() if music_player != null else 0,
		"voices": voices.size(), "admitted": admitted, "dropped": dropped, "sound": preferences.get("sound", true), "music": preferences.get("music", true)}
