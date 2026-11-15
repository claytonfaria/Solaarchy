# Solaarchy controlled performance measurements

Hardware: MX Mechanical Mini on Bolt (/dev/hidraw3) and G502 X Lightspeed (/dev/hidraw7). Original source is the installed plugin repository HEAD before the local patch; patched source is the staged change in this checkout. Solaar 1.1.20-2. No Solaar package files changed.

## Command latency

16 actual hardware writes: four enable/disable pairs per version, alternating version order by pair. Both use the same shared lock and timeout; patched commands additionally target the known receiver. The live shell remained patched during these trials. Therefore these results compare command construction, not full UI click-to-light latency or the scheduling patch under contention. All 16 commands succeeded; disabled state restored.

| Metric | Original | Patched |
|---|---:|---:|
| Trials | 8 | 8 |
| Mean wall time | 2.252 s | 2.211 s |
| Median wall time | 2.215 s | 2.209 s |
| Range | 2.211–2.490 s | 2.192–2.234 s |
| Mean command CPU | 1.245 s | 1.239 s |

Median improvement is only 0.006 s (0.27%). This does not establish a meaningful toggle latency improvement. The mean difference is dominated by a slower first original trial. Receiver targeting remains useful for limiting which receivers are opened, but is not a demonstrated speed optimization here.

## Same-stream hardware monitor comparison

Both versions listened simultaneously and read-only for approximately 120 seconds. This period included the toggle trials, three explicit status reads, and the beginning of the installed-plugin comparison. It is a diagnostic workload, not an idle workload. Both monitor copies see the same hardware reports. Neither monitor issues hardware writes.

Original emitted 16 link events, all online=true for the same mouse receiver/slot. Patched emitted one initial online event. That is 15 redundant events suppressed (93.75%). Applying the widget's 2.5-second online-event debounce to their timestamps yields 10 versus 1 refresh requests (90% fewer). These are timestamp-derived requests, not measured process launches; the separate installed-plugin comparison measures launches.

## Cost of one real status scan

Three read-only scans with both devices' features already known: 3/3 succeeded. Mean duration 2.939 seconds; mean CPU time 1.242 seconds. Peak child RSS reported by getrusage was approximately 92 MiB. This is transient allocation, not persistent memory savings. Avoiding a redundant scan avoids this measured work, subject to hardware state and scan variability.

## Monitor resources

Seven samples over one minute: original benchmark listener RSS stayed at 44,780 KiB with six file descriptors; patched stayed at 44,812 KiB with six file descriptors. CPU counters increased by 0.01 versus 0.02 seconds. The 32 KiB RSS difference is immaterial. Both were stable during this interval; this is not proof that no long-term leak exists. The installed patched monitor had nine descriptors because its stdout was integrated into the shell, so compare the two benchmark listeners with each other.

## Reproduction and limitations

Measurements used simultaneous read-only monitor processes, alternating receiver-scoped and unscoped `solaar config` enable/disable commands, and 100 ms `/proc` sampling of status helpers during one-minute installed-plugin phases. Raw captures are retained locally rather than publishing device identities and machine paths.

Short sampling windows, sequential installed-plugin phases, changing wireless state, OS scheduling and filesystem caching limit precision. No long-term battery-life, thermal, or memory-leak claim is established. The live A/B deliberately excludes manual toggles during its measurement phases and does not measure click-to-light latency.

## Installed-plugin A/B result

After ten seconds of settling per version, process sampling over 60 seconds observed **12 distinct status helpers with original code and zero with patched code**. Original helpers accumulated approximately **14.46 CPU seconds** in the sampled process counters; patched helpers accumulated zero because none launched in its window. This corresponds to about 24% of one logical core spent on original status helpers during this particular minute, not a claim about whole-machine CPU or long-term averages. Sampling can miss the last CPU ticks before exit. Both phases kept the same connected hardware and included no manual toggles. The phases were sequential rather than simultaneous, so wireless traffic may vary; the simultaneous raw-monitor result independently confirms duplicate reports on the same stream. The configured five-minute backup poll remains enabled, so zero scans in one patched minute does not mean zero ongoing scan cost.

The patched version is restored in the installed plugin. This demonstrates a material reduction in redundant background work on this machine, while the separate command benchmark establishes no meaningful direct backlight-command speed improvement.
