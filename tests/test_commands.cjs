const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('BarWidget.qml', 'utf8');
function extract(name) {
  const start = source.indexOf('  function ' + name + '(');
  const end = source.indexOf('\n  }', start) + 4;
  assert(start >= 0 && end > start);
  return source.slice(start, end);
}
const ctx = vm.createContext({});
vm.runInContext(extract('isLive') + '\n' + extract('solaarDeviceArg') + '\n' + extract('backlightCommand'), ctx);
function command(device, target) {
  return Array.from(ctx.backlightCommand(device, target));
}
const device = {id: 'A1B2C3D4', receiver: 'Bolt', online: true, stale: false, path: '/dev/hidraw3'};
assert.deepEqual(command(device, 1).slice(4), ['--hidraw', '/dev/hidraw3', 'config', 'A1B2C3D4', 'backlight', 'lowest']);
assert.equal(command(device, 0).at(-1), 'highest');
assert(!command({...device, path: undefined}, 1).includes('--hidraw'));
assert(!command({...device, path: '/tmp/anything'}, 1).includes('--hidraw'));
assert(command({name: 'Bluetooth Keyboard', path: '/dev/hidraw4'}, 1).includes('Bluetooth Keyboard'));
console.log('Backlight command regression checks passed');
vm.runInContext(extract('refresh'), ctx);
vm.runInContext(`
var refreshQueued = false;
var devices = [];
var helperPath = '/helper.py';
var root = {helperPath: helperPath};
var statusProc = {running: false};
var backlightProc = {running: true};
refresh();
`, ctx);
assert.equal(ctx.refreshQueued, true);
assert.equal(ctx.statusProc.running, false);
ctx.backlightProc.running = false;
ctx.refresh();
assert.equal(ctx.refreshQueued, false);
assert.equal(ctx.statusProc.running, true);
ctx.refresh();
assert.equal(ctx.refreshQueued, true);
console.log('Refresh scheduling regression checks passed');

assert(!command({...device, stale: true}, 1).includes('--hidraw'));
vm.runInContext(extract('handleMonitorLine'), ctx);
ctx.monitorError = '';
ctx.eventRefresh = {restart() { ctx.refreshRequests++; }};
ctx.refreshRequests = 0;
vm.runInContext(extract('markStale') + '\n' + extract('markOffline'), ctx);
ctx.checkConnections = () => {};
ctx.saveState = () => {};
ctx.devices = [{path: '/dev/hidraw7', number: 1, online: true, stale: false}];
const event = {event: 'link', path: '/dev/hidraw7', number: 1, online: true};
for (let i=0; i<1000; i++) ctx.handleMonitorLine(JSON.stringify(event));
assert.equal(ctx.refreshRequests, 0);
ctx.devices[0].online = false; // scan found offline, no link-lost event
ctx.handleMonitorLine(JSON.stringify(event));
assert.equal(ctx.refreshRequests, 1);
ctx.devices[0].online = true;
ctx.devices[0].stale = true;
ctx.handleMonitorLine(JSON.stringify(event));
assert.equal(ctx.refreshRequests, 2);
ctx.devices = [];
ctx.handleMonitorLine(JSON.stringify(event));
assert.equal(ctx.refreshRequests, 3);
ctx.devices = [{path: event.path, number: 1, online: true, stale: false}];
ctx.handleMonitorLine(JSON.stringify({...event, online: false}));
ctx.handleMonitorLine(JSON.stringify(event));
assert.equal(ctx.refreshRequests, 4);
ctx.handleMonitorLine(JSON.stringify({event: 'hotplug'}));
assert.equal(ctx.refreshRequests, 5);
console.log('Live-state event suppression and recovery checks passed');
