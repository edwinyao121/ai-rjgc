const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const timers = [];
const context = vm.createContext({
  console,
  Math,
  setTimeout: (fn, delay) => {
    timers.push({ fn, delay });
    return timers.length;
  },
  clearTimeout: () => {},
  document: {
    getElementById: () => ({}),
    querySelectorAll: () => [],
    querySelector: () => ({ dataset: { tab: 'mindmap' } }),
  },
  toast: () => {},
  renderPipeline: () => {},
  renderPipelineGraph: () => {},
  updateBadges: () => {},
});
context.window = context;

vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'pipeline-render.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'pipeline-actions.js'), 'utf8'), context);
vm.runInContext(`
  toast = function () {};
  renderPipeline = function () {};
  renderPipelineGraph = function () {};
  updateBadges = function () {};
  showGateBlockedDialog = function () { throw new Error("Gate blocked"); };
`, context);

const demoTask = vm.runInContext(
  'state.tasks.find(t => t.perfectDemo === true && t.status === "planning")',
  context
);

assert(demoTask, 'adds a planning task marked as the perfect demo');
assert.strictEqual(demoTask.pid, 'p5', 'demo task appears in the document management project kanban');
assert.match(demoTask.title, /公文|用印|归档|核验/, 'demo task title matches document management requirements');
assert(demoTask.stageNames.length > 0, 'demo task is already planned for pipeline monitoring');

const stageCount = demoTask.stageNames.length;
vm.runInContext('advanceStage(state.tasks.find(t => t.perfectDemo === true))', context);

const runningTask = vm.runInContext('state.tasks.find(t => t.perfectDemo === true)', context);
assert.strictEqual(runningTask.status, 'executing', 'one click starts a slower simulated execution');
assert(timers.length >= stageCount, 'demo execution schedules delayed stage simulation');
assert(timers.every(t => t.delay >= 1200), 'demo execution uses slower realistic delays');

while (timers.length > 0) {
  timers.shift().fn();
}

const finalTask = vm.runInContext('state.tasks.find(t => t.perfectDemo === true)', context);
assert.strictEqual(finalTask.status, 'done', 'demo task completes after advancing through all stages');
assert.strictEqual(finalTask.stageCurrent, stageCount - 1, 'demo task ends on the final stage');
assert(finalTask.stages.every(stage => stage >= 1), 'every demo stage is completed or passed');
assert(
  finalTask.stageGates.every(gates => gates.every(gate => gate === 1)),
  'every demo gate result is passing'
);

const activityText = vm.runInContext(
  'activityLogs[state.tasks.find(t => t.perfectDemo === true).id].map(log => log.text).join("\\n")',
  context
);
assert.match(activityText, /摘要|流转|双重身份核验|用印审批|归档|审计|档案编号/, 'demo activity log includes document-management business details');
