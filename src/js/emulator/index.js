import loadEmulator from "./module"

// As archive.c counts them.
const ARCHIVE_REGISTERS = 12

function problemIn(emulator) {
  const at = emulator._archive_problem(),
    letters = []

  for (let step = 0; emulator.HEAPU8[at + step] != 0; step++) {
    letters.push(String.fromCharCode(emulator.HEAPU8[at + step]))
  }

  return letters.join("")
}

function loadSnapshot(emulator, snapshot, monitor) {
  const capacity = emulator._archive_snapshot_capacity(),
    fits = snapshot.length <= capacity

  if (!fits) {
    throw new Error(`a snapshot of ${snapshot.length} bytes does not fit in ${capacity}`)
  }

  if (monitor) {
    emulator._archive_connect_monitor()
  }

  const snapshotAt = emulator._archive_snapshot()

  emulator.HEAPU8.set(snapshot, snapshotAt)

  const loaded = emulator._archive_load_snapshot(snapshot.length)
  if (!loaded) {
    throw new Error(problemIn(emulator))
  }
}

function loadState(emulator, state, monitor) {
  const stateAt = emulator._archive_state()

  emulator.HEAPU8.set(state, stateAt)
  emulator._archive_load_state(monitor)
}

async function cpcFrom({ snapshot, state, ramBytes, monitor }) {
  const emulator = await loadEmulator()

  emulator._archive_boot_cpc(ramBytes)

  if (state) {
    loadState(emulator, state, monitor)
  } else {
    loadSnapshot(emulator, snapshot, monitor)
  }

  const stateAt = emulator._archive_state(),
    stateSize = emulator._archive_state_size(),
    registersAt = emulator._archive_registers(),
    ramAt = emulator._archive_ram(),
    framebufferAt = emulator._archive_monitor(),
    raster = emulator._archive_monitor_width(),
    lines = emulator._archive_monitor_height()

  return {
    ram: emulator.HEAPU8.subarray(ramAt, ramAt + ramBytes),
    framebuffer: emulator.HEAPU8.subarray(framebufferAt, framebufferAt + raster * lines),
    raster,
    rgb: emulator._archive_rgb,
    call: emulator._archive_call,
    registers: emulator.HEAPU8.subarray(registersAt, registersAt + ARCHIVE_REGISTERS),
    readRegisters: emulator._archive_read_registers,
    state: emulator.HEAPU8.subarray(stateAt, stateAt + stateSize),
    saveState: emulator._archive_save_state,
    ink: emulator._archive_cpc_ink,
    runFrames: emulator._archive_run_frames,
    videoCharacters: emulator._archive_cpc_video_characters,
    videoMode: emulator._archive_cpc_video_mode,
    videoRasters: emulator._archive_cpc_video_rasters,
    videoRows: emulator._archive_cpc_video_rows,
    videoStart: emulator._archive_cpc_video_start
  }
}

export default cpcFrom
