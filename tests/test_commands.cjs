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
vm.runInContext(extract('solaarDeviceArg') + '\n' + extract('backlightCommand'), ctx);
function command(device, target) {
  return Array.from(ctx.backlightCommand(device, target));
}
const device = {id: 'F8678E05', receiver: 'Bolt', path: '/dev/hidraw3'};
assert.deepEqual(command(device, 1).slice(4), ['--hidraw', '/dev/hidraw3', 'config', 'F8678E05', 'backlight', 'lowest']);
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
