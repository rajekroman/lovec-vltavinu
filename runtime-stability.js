(() => {
  "use strict";

  const app = document.getElementById("app");
  const hud = document.getElementById("hud");
  const controls = document.getElementById("controls");
  const moveZone = document.getElementById("moveZone");
  const stick = document.getElementById("stick");
  const actionButton = document.getElementById("actionButton");
  const screens = [...document.querySelectorAll(".screen")];
  const coarsePointer = navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches;
  const debugEnabled = new URLSearchParams(location.search).has("debug");

  if (!app || !hud || !controls || !moveZone || !stick || !actionButton || !screens.length) return;

  let activeMovePointer = null;
  let lastVisibleScreen = null;
  let invariantQueued = false;
  let correctingInvariant = false;
  let lastActionPointerAt = 0;
  const lastButtonClick = new WeakMap();
  const resetLog = [];

  function pointerCancel(pointerId) {
    const options = {
      bubbles: true,
      cancelable: true,
      pointerId: pointerId ?? 1,
      pointerType: "touch",
      isPrimary: true
    };
    try {
      return new PointerEvent("pointercancel", options);
    } catch {
      const event = new Event("pointercancel", { bubbles: true, cancelable: true });
      try { Object.defineProperty(event, "pointerId", { value: options.pointerId }); } catch {}
      return event;
    }
  }

  function releaseKeyboard() {
    for (const code of ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]) {
      try { dispatchEvent(new KeyboardEvent("keyup", { code, key: code, bubbles: true })); } catch {}
    }
  }

  function resetInput(reason = "manual") {
    if (activeMovePointer !== null) {
      try { moveZone.dispatchEvent(pointerCancel(activeMovePointer)); } catch {}
      try {
        if (moveZone.hasPointerCapture?.(activeMovePointer)) moveZone.releasePointerCapture(activeMovePointer);
      } catch {}
    }
    activeMovePointer = null;
    stick.style.transform = "translate(-50%,-50%)";
    actionButton.classList.remove("active");
    releaseKeyboard();
    resetLog.push({ reason, at: new Date().toISOString() });
    if (resetLog.length > 20) resetLog.shift();
  }

  function visibleScreens() {
    return screens.filter(screen => screen.classList.contains("visible"));
  }

  function reconcileUi(trigger = null) {
    if (correctingInvariant) return;
    correctingInvariant = true;
    try {
      let visible = visibleScreens();
      if (visible.length > 1) {
        const preferred = trigger?.classList?.contains("visible")
          ? trigger
          : (lastVisibleScreen?.classList?.contains("visible") ? lastVisibleScreen : visible[visible.length - 1]);
        for (const screen of visible) {
          if (screen !== preferred) screen.classList.remove("visible");
        }
        visible = preferred ? [preferred] : [];
      }

      if (visible.length === 1) {
        lastVisibleScreen = visible[0];
        resetInput(`overlay:${visible[0].id}`);
      }

      const playing = app.classList.contains("playing") && visible.length === 0;
      hud.classList.toggle("hidden", !playing);
      controls.classList.toggle("hidden", !playing || !coarsePointer);
      if (!playing) actionButton.classList.remove("active");

      app.dataset.runtimeScreen = visible[0]?.id || (playing ? "playing" : "none");
      app.dataset.runtimeStable = visible.length <= 1 ? "true" : "false";
    } finally {
      correctingInvariant = false;
    }
  }

  function queueInvariantCheck(trigger = null) {
    if (invariantQueued) return;
    invariantQueued = true;
    queueMicrotask(() => {
      invariantQueued = false;
      reconcileUi(trigger);
    });
  }

  moveZone.addEventListener("pointerdown", event => {
    activeMovePointer = event.pointerId;
  }, true);

  addEventListener("pointerup", event => {
    if (event.pointerId === activeMovePointer) activeMovePointer = null;
  }, true);

  addEventListener("pointercancel", event => {
    if (event.pointerId === activeMovePointer) activeMovePointer = null;
  }, true);

  actionButton.addEventListener("pointerdown", event => {
    const now = performance.now();
    if (now - lastActionPointerAt < 120) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    lastActionPointerAt = now;
  }, true);

  document.addEventListener("click", event => {
    const button = event.target.closest?.("button");
    if (!button) return;
    const now = performance.now();
    const previous = lastButtonClick.get(button) || 0;
    if (now - previous < 180) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    lastButtonClick.set(button, now);
  }, true);

  const observer = new MutationObserver(records => {
    let trigger = null;
    for (const record of records) {
      if (record.type === "attributes" && record.target.classList?.contains("screen")) trigger = record.target;
    }
    queueInvariantCheck(trigger);
  });

  observer.observe(app, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });

  const resetAndReconcile = reason => {
    resetInput(reason);
    requestAnimationFrame(() => {
      reconcileUi();
      requestAnimationFrame(() => reconcileUi());
    });
  };

  addEventListener("blur", () => resetAndReconcile("window-blur"));
  addEventListener("pagehide", () => resetAndReconcile("pagehide"));
  addEventListener("pageshow", event => resetAndReconcile(event.persisted ? "bfcache-restore" : "pageshow"));
  addEventListener("orientationchange", () => setTimeout(() => resetAndReconcile("orientationchange"), 140));
  addEventListener("resize", () => resetInput("resize"), { passive: true });

  document.addEventListener("visibilitychange", () => {
    resetAndReconcile(document.hidden ? "visibility-hidden" : "visibility-visible");
  });

  document.addEventListener("touchend", event => {
    if (!event.touches?.length && activeMovePointer !== null) resetInput("touchend-fallback");
  }, { passive: true, capture: true });

  function installDebugPanel() {
    if (!debugEnabled) return null;
    const style = document.createElement("style");
    style.textContent = `
      #runtimeDebugPanel{position:fixed;z-index:1000;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));bottom:max(8px,env(safe-area-inset-bottom));max-height:38vh;overflow:auto;padding:10px 12px;border:1px solid rgba(255,120,105,.65);border-radius:10px;background:rgba(35,8,7,.94);color:#ffe9e6;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;box-shadow:0 12px 40px rgba(0,0,0,.55)}
      #runtimeDebugPanel[hidden]{display:none!important}
      #runtimeDebugPanel button{margin-top:8px;padding:7px 10px;border:0;border-radius:7px;background:#f1c7be;color:#24100d;font-weight:800}
    `;
    document.head.append(style);

    const panel = document.createElement("section");
    panel.id = "runtimeDebugPanel";
    panel.hidden = true;
    panel.setAttribute("role", "alert");
    panel.innerHTML = `<strong>Runtime chyba</strong><pre></pre><button type="button">Obnovit stránku</button>`;
    panel.querySelector("button").addEventListener("click", () => location.reload());
    document.body.append(panel);
    return panel;
  }

  const debugPanel = installDebugPanel();

  function reportError(kind, detail) {
    const message = detail instanceof Error
      ? `${detail.name}: ${detail.message}\n${detail.stack || ""}`
      : String(detail ?? "Neznámá chyba");
    console.error(`[Lovec runtime/${kind}]`, detail);
    if (debugPanel) {
      debugPanel.hidden = false;
      debugPanel.querySelector("pre").textContent = `${kind}\n${message}`;
    }
  }

  addEventListener("error", event => reportError("error", event.error || `${event.message} @ ${event.filename}:${event.lineno}`));
  addEventListener("unhandledrejection", event => reportError("promise", event.reason));

  window.__lovecRuntime = Object.freeze({
    version: "5.2.0",
    resetInput,
    reconcileUi,
    snapshot() {
      return {
        screen: app.dataset.runtimeScreen,
        stable: app.dataset.runtimeStable === "true",
        appPlaying: app.classList.contains("playing"),
        hudHidden: hud.classList.contains("hidden"),
        controlsHidden: controls.classList.contains("hidden"),
        activeMovePointer,
        resetLog: [...resetLog]
      };
    }
  });

  resetAndReconcile("runtime-boot");
})();
