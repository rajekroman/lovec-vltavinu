import test from "node:test";
import assert from "node:assert/strict";
import { SLAVIA_PHASES, SlaviaObjectiveFlow } from "../../src/gameplay/SlaviaObjectiveFlow.js";

test("Slavia objective flow enforces canonical phase order through jury submission", () => {
  const flow = new SlaviaObjectiveFlow();
  assert.deepEqual(SLAVIA_PHASES, [
    "documents",
    "expert-consultation",
    "thief-recovery",
    "certification",
    "event-entry",
    "jury-selection",
    "complete"
  ]);
  assert.equal(flow.state.phase, "documents");
  assert.throws(() => flow.consultExpert(), /three documents/);
  assert.throws(() => flow.completeJurySelection(), /event must be entered/i);

  flow.collectDocument("slavia-document-chlum");
  flow.collectDocument("slavia-document-nesmen");
  assert.equal(flow.state.phase, "documents");
  flow.collectDocument("slavia-document-besednice");
  assert.equal(flow.state.phase, "expert-consultation");

  flow.consultExpert();
  assert.equal(flow.state.expertConsulted, true);
  assert.equal(flow.state.thiefStarted, true);
  assert.equal(flow.state.phase, "thief-recovery");
  assert.throws(() => flow.receiveCertificate(), /thief recovery/);

  flow.defeatThief();
  assert.equal(flow.state.phase, "certification");
  flow.receiveCertificate();
  assert.equal(flow.state.phase, "event-entry");
  flow.enterEvent();
  assert.equal(flow.state.phase, "jury-selection");
  assert.equal(flow.state.enteredEvent, true);
  assert.equal(flow.state.complete, false);
  assert.equal(flow.state.jurySubmitted, false);

  flow.completeJurySelection();
  assert.equal(flow.state.phase, "complete");
  assert.equal(flow.state.complete, true);
  assert.equal(flow.state.jurySubmitted, true);
});

test("Slavia objective actions are idempotent and immutable", () => {
  const flow = new SlaviaObjectiveFlow();
  const first = flow.collectDocument("slavia-document-chlum");
  const repeated = flow.collectDocument("slavia-document-chlum");
  assert.equal(repeated, first);
  assert.deepEqual(repeated.documents, ["slavia-document-chlum"]);
  assert.equal(Object.isFrozen(repeated), true);
  assert.equal(Object.isFrozen(repeated.documents), true);

  flow.collectDocument("slavia-document-nesmen");
  flow.collectDocument("slavia-document-besednice");
  const consulted = flow.consultExpert();
  assert.equal(flow.consultExpert(), consulted);
  const defeated = flow.defeatThief();
  assert.equal(flow.defeatThief(), defeated);
  const certified = flow.receiveCertificate();
  assert.equal(flow.receiveCertificate(), certified);
  const entered = flow.enterEvent();
  assert.equal(flow.enterEvent(), entered);
  const complete = flow.completeJurySelection();
  assert.equal(flow.completeJurySelection(), complete);
});

test("Slavia objective flow rejects invalid shortcuts", () => {
  const flow = new SlaviaObjectiveFlow();
  assert.throws(() => flow.collectDocument(""), /non-empty string/);
  assert.throws(() => flow.defeatThief(), /has not started/);
  assert.throws(() => flow.receiveCertificate(), /required before certification/);
  assert.throws(() => flow.enterEvent(), /certificate is required/i);
  assert.throws(() => flow.completeJurySelection(), /event must be entered/i);

  flow.collectDocument("a");
  flow.collectDocument("b");
  flow.collectDocument("c");
  flow.consultExpert();
  assert.throws(() => flow.collectDocument("d"), /documents phase/);
});
