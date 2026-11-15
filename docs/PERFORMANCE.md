# Performance validation

## Current implementation: clean installed-plugin comparison

Hardware: MX Mechanical Mini on Bolt and G502 X Lightspeed; Solaar 1.1.20-2. Original source is upstream commit 5ae412b. The reviewed patch suppresses redundant refreshes only when the widget has a currently live device at the reported receiver path and slot. Offline, stale, unknown, and unpaired devices retain refresh/recovery behavior.

Each version was installed and the desktop shell was restarted to guarantee fresh QML. After 10 seconds of settling, process state was sampled every 100 ms for 30 seconds. The phases were sequential, original then patched, without manual toggles. The final patch was restored and the shell restarted afterward.

| Measurement | Original | Reviewed patch |
| --- | ---: | ---: |
| Sampling window | 30.09 s | 30.04 s |
| Distinct status helpers observed | 7 | 0 |
| Observed status-helper CPU | 7.68 CPU-seconds | 0.00 CPU-seconds |

CPU is summed from the observed per-process counters, subtracting any CPU already used by a helper present at the beginning. Sampling can miss final CPU ticks. These figures measure status helpers, not whole-system CPU. Wireless traffic can vary between sequential phases. The five-minute backup poll remains enabled, so an empty short window does not mean zero ongoing scan cost.

## Why a clean reload matters

Earlier file-change-only switching did not reliably replace the live QML widget. Diagnostic logging proved that the old instance survived plugin-reload notifications until a full shell restart. Therefore ambiguous follow-up figures were discarded. The initial listener-side suppression experiment remains historical diagnostic evidence (16 identical reports versus one, 12 versus zero scans in one-minute phases), but that implementation was replaced after independent review found recovery risks. The current figures above use clean shell restarts.

## Command latency of the current patch

Sixteen alternating actual hardware writes, eight per version, compared the original command with receiver targeting. All succeeded. Original median 2.215 seconds; scoped command median 2.209 seconds. This 6 ms difference does not establish a meaningful latency improvement. It excludes UI click handling and lock waiting.

Three independent full status reads averaged 2.939 seconds wall time and 1.242 CPU-seconds; all succeeded. Avoiding unnecessary scans removes this work. Original and initial patched listeners both had flat RSS and descriptor counts in a one-minute observation; no persistent memory saving or long-term leak-freedom claim is established.

## Separate targeted-helper prototype — not included or installed

Profiling found optional child-node discovery repeatedly enumerating udev for about one second. A short-lived experimental helper instead selects the known receiver slot, verifies the paired serial, uses Solaar's normal receiver-handle fallback, and calls the unchanged config implementation.

Across sixteen alternating writes, eight per version: CLI median 2.214 seconds versus prototype 0.488 seconds (77.94% lower); mean CPU 1.239 versus 0.224 seconds (81.90% lower); all commands exited successfully. Original disabled state was restored. Exit success alone does not prove hardware readback, GUI synchronization, or persistence.

This prototype remains outside the PR until no-proxy comparisons, readback, GUI coexistence/persistence, disconnected-device, stale-path/identity, compatibility and safe-fallback checks are complete. It adds no permanent daemon and changes no installed Solaar package files.

## Regression validation

Node checks execute actual QML functions for command construction, stale-path fallback, deferred refresh scheduling, 1,000 repeated live online events, offline/stale/unknown recovery, actual offline marking, reconnects and hotplug. Python tests cover unpair, link transitions and irrelevant report parsing. Python compilation and diff checks pass.

Opus reviewed source read-only twice; it did not execute tests. Its recovery concerns drove the current implementation. Raw captures remain local because they contain device identities and machine paths.
