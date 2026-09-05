import assert from "node:assert/strict";
import { test } from "node:test";
import { createCompilerClient } from "./client.js";

function harness(t, timeout) {
  const workers = [],
    states = [],
    results = [],
    packages = [];
  const client = createCompilerClient({
    timeout,
    createWorker() {
      const worker = {
        messages: [],
        terminated: false,
        postMessage(message) {
          this.messages.push(message);
        },
        terminate() {
          this.terminated = true;
        },
      };
      workers.push(worker);
      return worker;
    },
    onState: (state) => states.push(state),
    onResult: (result) => results.push(result),
    onPackages: (value) => packages.push(value),
  });
  t.after(() => client.dispose());
  client.updateFiles([
    { path: "Main.purs", source: "module Main where\nx = 1" },
  ]);
  client.start();
  const send = (data, worker = workers.at(-1)) => worker.onmessage({ data });
  return { client, workers, states, results, packages, send };
}

test("loads packages and compiles a file collection, reporting diagnostics", (t) => {
  const h = harness(t);
  h.send({ type: "progress", message: "Loading packages… 24/85" });
  assert.deepEqual(h.states.at(-1), { phase: "loading", message: "Loading packages… 24/85" });
  h.send({ type: "ready", packages: [{ name: "prelude" }] });
  h.send({ type: "progress", message: "late progress" });
  assert.equal(h.states.at(-1).phase, "compiling");
  assert.equal(h.packages[0][0].name, "prelude");
  const request = h.workers[0].messages.at(-1);
  assert.equal(request.type, "compile");
  assert.equal(request.files[0].path, "Main.purs");
  h.send({
    type: "result",
    id: request.id,
    outputs: [],
    diagnostics: [{ severity: "error" }],
    duration: 1,
  });
  assert.equal(h.states.at(-1).phase, "errors");
  assert.equal(h.results.length, 1);
});

test("discards output when source changes during a compile and accepts the next result", (t) => {
  const h = harness(t);
  h.send({ type: "ready", packages: [] });
  const first = h.workers[0].messages.at(-1);
  h.client.updateFiles([
    { path: "Main.purs", source: "module Main where\nx = 2" },
  ]);
  h.send({
    type: "result",
    id: first.id,
    outputs: [],
    diagnostics: [],
    duration: 1,
  });
  assert.equal(h.results.length, 0);
  assert.equal(h.states.at(-1).phase, "edited");
  h.client.compile();
  const second = h.workers[0].messages.at(-1);
  assert.notEqual(second.id, first.id);
  h.send({
    type: "result",
    id: second.id,
    outputs: [{ path: "Main/index.js", source: "export const x = 2;" }],
    diagnostics: [],
    duration: 2,
  });
  assert.equal(h.results.length, 1);
  assert.equal(h.states.at(-1).phase, "success");
});

test("cancellation terminates the worker; retry ignores late messages from it", (t) => {
  const h = harness(t);
  h.send({ type: "ready", packages: [] });
  const old = h.workers[0];
  h.client.cancel();
  assert.equal(old.terminated, true);
  assert.equal(h.states.at(-1).phase, "failed");
  h.client.start();
  h.send({ type: "failure", message: "late trap" }, old);
  assert.equal(h.states.at(-1).phase, "loading");
  h.send({ type: "ready", packages: [] });
  assert.equal(h.states.at(-1).phase, "compiling");
});

test("worker failures are recoverable without losing source files", (t) => {
  const h = harness(t);
  h.workers[0].onerror();
  assert.equal(h.workers[0].terminated, true);
  assert.equal(h.states.at(-1).phase, "failed");
  h.client.start();
  h.send({ type: "ready", packages: [] });
  assert.equal(
    h.workers[1].messages.at(-1).files[0].source,
    "module Main where\nx = 1",
  );
});

test("a hung compile times out and terminates its worker", async (t) => {
  const h = harness(t, 5);
  h.send({ type: "ready", packages: [] });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.states.at(-1).phase, "failed");
  assert.match(h.states.at(-1).message, /too long/);
  assert.equal(h.workers[0].terminated, true);
});

test("debounces rapid edits and compiles only the latest files automatically", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = harness(t);
  h.send({ type: "ready", packages: [] });
  const initial = h.workers[0].messages.at(-1);
  h.send({
    type: "result",
    id: initial.id,
    outputs: [],
    diagnostics: [],
    duration: 1,
  });
  h.client.updateFiles([{ path: "Main.purs", source: "first" }]);
  t.mock.timers.tick(400);
  h.client.updateFiles([{ path: "Main.purs", source: "latest" }]);
  t.mock.timers.tick(499);
  assert.equal(h.workers[0].messages.at(-1).id, initial.id);
  t.mock.timers.tick(1);
  assert.equal(h.workers[0].messages.at(-1).files[0].source, "latest");
});

test("queues debounced edits behind an in-flight compile without publishing stale output", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = harness(t);
  h.send({ type: "ready", packages: [] });
  const initial = h.workers[0].messages.at(-1);
  h.client.updateFiles([{ path: "Main.purs", source: "latest" }]);
  t.mock.timers.tick(500);
  assert.equal(h.workers[0].messages.at(-1).id, initial.id);
  h.send({
    type: "result",
    id: initial.id,
    outputs: [],
    diagnostics: [],
    duration: 1,
  });
  assert.equal(h.results.length, 0);
  assert.equal(h.workers[0].messages.at(-1).files[0].source, "latest");
  assert.equal(h.states.at(-1).phase, "compiling");
});
