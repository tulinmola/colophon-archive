/*
 * archive.c — what a colophon's cell asks of a machine.
 *
 * The lower ROM is a page of zeros: a snapshot brings its own memory, and a
 * game that has switched both ROMs out never reads one.
 */
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include "cpc.h"
#include "cpc_snapshot.h"
#include "gate_array.h"

#define ARCHIVE_RAM_SIZE 0x20000
#define ARCHIVE_ROM_SIZE 0x4000
#define ARCHIVE_SNAPSHOT_SIZE (CPC_SNAPSHOT_HEADER_SIZE + ARCHIVE_RAM_SIZE)

static cpc_t cpc;
static uint8_t ram[ARCHIVE_RAM_SIZE];
static const uint8_t rom[ARCHIVE_ROM_SIZE];
static uint8_t snapshot[ARCHIVE_SNAPSHOT_SIZE];
static uint8_t framebuffer[CPC_FRAMEBUFFER_WIDTH * CPC_FRAMEBUFFER_HEIGHT];
static const char *problem;

void archive_boot_cpc(uint32_t ram_bytes) {
  problem = NULL;
  cpc_init(&cpc, ram, ram_bytes, rom);
}

/* A monitor is plugged in after the machine is stood up, because cpc_init
   clears the socket with everything else. */
void archive_connect_monitor(void) { cpc_connect_monitor(&cpc, framebuffer); }

uint8_t *archive_snapshot(void) { return snapshot; }

uint32_t archive_snapshot_capacity(void) { return sizeof snapshot; }

bool archive_load_snapshot(uint32_t length) {
  return cpc_snapshot_load(&cpc, snapshot, length, &problem);
}

const char *archive_problem(void) { return problem; }

uint8_t *archive_ram(void) { return ram; }

uint32_t archive_ram_capacity(void) { return sizeof ram; }

uint8_t *archive_monitor(void) { return framebuffer; }

uint16_t archive_monitor_width(void) { return CPC_FRAMEBUFFER_WIDTH; }

uint16_t archive_monitor_height(void) { return CPC_FRAMEBUFFER_HEIGHT; }

uint32_t archive_rgb(uint8_t colour_code) { return gate_array_rgb(colour_code); }

/* The CRTC as it stands, in the registers the Compendium names: R1 Horizontal
   Displayed, R6 Vertical Displayed, R9 Maximum Raster Address, and R12/R13
   Start Address as the board wires the pair into an address. */
uint32_t archive_cpc_video_start(void) {
  const uint8_t high = cpc.crtc.registers[12], low = cpc.crtc.registers[13];

  return (uint32_t)(((high & 0x30) << 10) | ((high & 0x03) << 9) | (low << 1));
}

uint8_t archive_cpc_video_characters(void) { return cpc.crtc.registers[1]; }

uint8_t archive_cpc_video_rows(void) { return cpc.crtc.registers[6]; }

uint8_t archive_cpc_video_rasters(void) { return (uint8_t)(cpc.crtc.registers[9] + 1); }

/* The Gate Array as it stands: the mode in force rather than the one last
   written, and the inks by pen, 0-15 with 16 the border. */
uint8_t archive_cpc_video_mode(void) { return cpc.gate_array.mode; }

uint8_t archive_cpc_ink(uint8_t pen) { return cpc.gate_array.inks[pen]; }

/* The registers a call is given and answers with, in the order the archive
   counts them. The CPU keeps them as halves, and so does this. */
#define ARCHIVE_REGISTERS 12

static uint8_t registers[ARCHIVE_REGISTERS];

uint8_t *archive_registers(void) { return registers; }

void archive_read_registers(void) {
  registers[0] = cpc.cpu.a;
  registers[1] = cpc.cpu.f;
  registers[2] = cpc.cpu.b;
  registers[3] = cpc.cpu.c;
  registers[4] = cpc.cpu.d;
  registers[5] = cpc.cpu.e;
  registers[6] = cpc.cpu.h;
  registers[7] = cpc.cpu.l;
  registers[8] = cpc.cpu.ixh;
  registers[9] = cpc.cpu.ixl;
  registers[10] = cpc.cpu.iyh;
  registers[11] = cpc.cpu.iyl;
}

static void archive_write_registers(void) {
  cpc.cpu.a = registers[0];
  cpc.cpu.f = registers[1];
  cpc.cpu.b = registers[2];
  cpc.cpu.c = registers[3];
  cpc.cpu.d = registers[4];
  cpc.cpu.e = registers[5];
  cpc.cpu.h = registers[6];
  cpc.cpu.l = registers[7];
  cpc.cpu.ixh = registers[8];
  cpc.cpu.ixl = registers[9];
  cpc.cpu.iyh = registers[10];
  cpc.cpu.iyl = registers[11];
}

/* The address a call is told to return to. Nothing is ever fetched from it,
   because the run stops the moment PC stands there. */
#define ARCHIVE_RETURN_TO 0xFFFF

bool archive_call(uint16_t address, bool interrupts, uint32_t frames) {
  const uint64_t ticks = (uint64_t)frames * CPC_TICKS_PER_STANDARD_FRAME;
  const bool iff1 = cpc.cpu.iff1, iff2 = cpc.cpu.iff2;

  cpc_finish_instruction(&cpc);
  archive_write_registers();

  cpc.cpu.sp = (uint16_t)(cpc.cpu.sp - 2);
  cpc_poke(&cpc, cpc.cpu.sp, ARCHIVE_RETURN_TO & 0xFF);
  cpc_poke(&cpc, (uint16_t)(cpc.cpu.sp + 1), ARCHIVE_RETURN_TO >> 8);
  cpc.cpu.pc = address;

  if (!interrupts) {
    cpc.cpu.iff1 = false;
    cpc.cpu.iff2 = false;
  }

  bool returned = false;
  for (uint64_t at = 0; at < ticks && !returned; at++) {
    cpc_tick(&cpc);
    returned = cpc.cpu.pc == ARCHIVE_RETURN_TO && z80_instruction_complete(&cpc.cpu);
  }

  if (!interrupts) {
    cpc.cpu.iff1 = iff1;
    cpc.cpu.iff2 = iff2;
  }

  archive_read_registers();

  return returned;
}

void archive_run_frames(uint32_t frames) {
  const uint64_t ticks = (uint64_t)frames * CPC_TICKS_PER_STANDARD_FRAME;

  for (uint64_t at = 0; at < ticks; at++) {
    cpc_tick(&cpc);
  }
}
