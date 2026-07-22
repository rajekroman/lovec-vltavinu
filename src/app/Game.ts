import { EventBus } from "../core/events/EventBus";
import type { GameEvents } from "../core/events/GameEvents";
import { AssetManager } from "../engine/assets/AssetManager";
import { SoundManager } from "../engine/audio/SoundManager";
import { InputManager } from "../engine/input/InputManager";
import { RendererService } from "../engine/rendering/RendererService";
import { SceneManager } from "../engine/scenes/SceneManager";
import { GameplayScene } from "../game/scenes/GameplayScene";
import { getLevelDefinition, getNextLevel, type LevelId, LEVELS } from "../game/levels/LevelData";
import { HudController } from "../ui/HudController";
import { evaluateFinalCollection } from "../game/systems/FinalJury";
import { GameLoop } from "./GameLoop";
import { createSessionState } from "./SessionState";

export class Game {
  private readonly events = new EventBus<GameEvents>();
  private readonly input = new InputManager();
  private readonly assets = new AssetManager(this.events);
  private readonly sound = new SoundManager(this.events);
  private readonly scenes = new SceneManager();
  private readonly renderer: RendererService;
  private readonly hud: HudController;
  private readonly loop: GameLoop;
  private readonly session = createSessionState();
  private readonly gameUnsubscribers: Array<() => void> = [];
  private readonly onVisibilityChange = (): void => {
    if (!document.hidden || !this.started || this.paused) {
      return;
    }

    this.input.reset();
    this.setPaused(true);
    this.events.emit("ui:toastRequested", {
      text: "Hra byla pozastavena po opuštění okna.",
      durationMs: 3000,
    });
    this.events.flush();
  };

  private started = false;
  private paused = true;
  private transitionInProgress = false;
  private finished = false;

  constructor(root: HTMLElement, canvas: HTMLCanvasElement) {
    this.renderer = new RendererService(canvas);
    this.input.bindTouchControls(root);
    this.gameUnsubscribers.push(
      this.events.on("collectible:found", ({ score, stone }) => {
        this.session.collectionScore += score;
        this.session.foundCount += 1;
        this.session.stones.push(stone);
      }),
      this.events.on("level:completed", ({ levelId }) => {
        void this.advanceToNextLevel(levelId as LevelId);
      }),
      this.events.on("game:completed", () => {
        this.finished = true;
        this.started = false;
        this.setPaused(true);
        this.hud?.showFinalResult(evaluateFinalCollection(this.session.stones));
      }),
    );

    this.hud = new HudController(root, this.events, {
      onStart: () => {
        void this.startSession();
      },
      onRetryLoad: () => {
        void this.retryCurrentLevel();
      },
      onPauseToggle: () => this.togglePause(),
    });
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.loop = new GameLoop({
      beforeFrame: () => {
        if (this.input.consumePressed("pause")) {
          this.togglePause();
        }
      },
      shouldSimulate: () => this.started && !this.paused,
      fixedUpdate: (dt) => {
        this.scenes.fixedUpdate(dt);
        this.events.flush();
      },
      renderUpdate: (frameDt, alpha) => {
        this.scenes.renderUpdate(frameDt, alpha);
        const activeScene = this.scenes.getActive();
        this.renderer.render(activeScene.getThreeScene(), activeScene.getCamera());
        this.events.flush();
      },
    });
  }

  async initialize(): Promise<void> {
    await this.assets.initialize();
    this.scenes.register(
      "gameplay",
      () => new GameplayScene(
        this.assets,
        this.input,
        this.events,
        this.session.currentLevelId,
        () => ({
          stoneCount: this.session.stones.length,
          localityCount: new Set(this.session.stones.map((stone) => stone.locality)).size,
        }),
      ),
    );
    await this.scenes.changeTo("gameplay");
    this.hud.showBriefing(getLevelDefinition(this.session.currentLevelId));
    this.events.flush();
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.hud.dispose();
    this.scenes.dispose();
    this.sound.dispose();
    this.assets.dispose();
    this.input.dispose();
    this.renderer.dispose();
    this.gameUnsubscribers.forEach((unsubscribe) => unsubscribe());
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.events.clear();
  }

  private async startSession(): Promise<void> {
    this.input.reset();
    this.sound.setAmbientProfile(this.session.currentLevelId);
    this.sound.unlock();

    if (this.finished) {
      if (this.transitionInProgress) {
        return;
      }

      this.resetSession();
      this.sound.setAmbientProfile(this.session.currentLevelId);
      this.hud.resetForNewSession();
      this.hud.showBriefing(getLevelDefinition(this.session.currentLevelId));
      this.transitionInProgress = true;
      try {
        await this.scenes.changeTo("gameplay");
        this.hud.showBriefing(getLevelDefinition(this.session.currentLevelId));
      } catch (error) {
        console.error("Nepodařilo se znovu načíst první level.", error);
        this.hud.showLoadError(
          getLevelDefinition(this.session.currentLevelId),
          "Novou výpravu se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.",
        );
      } finally {
        this.transitionInProgress = false;
      }
      return;
    }

    if (this.transitionInProgress) {
      return;
    }

    this.started = true;
    this.setPaused(false);
    this.sound.playCue("briefing");
    this.events.emit("ui:toastRequested", {
      text: `Průzkum lokality ${this.session.currentLevelId.toUpperCase()} zahájen.`,
      durationMs: 2200,
    });
  }

  private togglePause(): void {
    if (!this.started) {
      return;
    }

    this.setPaused(!this.paused);
  }

  private setPaused(paused: boolean): void {
    this.input.reset();

    if (this.paused === paused) {
      return;
    }

    this.paused = paused;
    this.events.emit("game:pauseChanged", { paused });
    this.events.flush();
  }

  private async advanceToNextLevel(levelId: LevelId): Promise<void> {
    if (this.transitionInProgress || this.finished) {
      return;
    }

    this.transitionInProgress = true;
    this.started = false;
    this.setPaused(true);

    const nextLevel = getNextLevel(levelId);
    if (!nextLevel) {
      this.transitionInProgress = false;
      return;
    }

    const nextIndex = LEVELS.findIndex((level) => level.id === nextLevel.id);
    this.session.currentLevelIndex = nextIndex;
    this.session.currentLevelId = nextLevel.id;
    this.sound.setAmbientProfile(nextLevel.id);
    this.hud.showBriefing(nextLevel);
    try {
      await this.scenes.changeTo("gameplay");
      this.hud.showBriefing(nextLevel);
    } catch (error) {
      console.error(`Nepodařilo se načíst level ${nextLevel.id}.`, error);
      this.started = false;
      this.hud.showLoadError(
        nextLevel,
        `Level ${nextLevel.location} se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.`,
      );
    } finally {
      this.transitionInProgress = false;
    }
  }

  private async retryCurrentLevel(): Promise<void> {
    if (this.transitionInProgress || this.finished) {
      return;
    }

    const level = getLevelDefinition(this.session.currentLevelId);
    this.transitionInProgress = true;
    this.started = false;
    this.setPaused(true);
    this.hud.showBriefing(level);

    try {
      await this.scenes.changeTo("gameplay");
      this.hud.showBriefing(level);
    } catch (error) {
      console.error(`Opakované načtení levelu ${level.id} selhalo.`, error);
      this.hud.showLoadError(
        level,
        `Level ${level.location} se nepodařilo načíst ani napodruhé. Zkuste to znovu nebo obnovte stránku.`,
      );
    } finally {
      this.transitionInProgress = false;
    }
  }

  private resetSession(): void {
    this.session.currentLevelIndex = 0;
    this.session.currentLevelId = "chlum";
    this.session.foundCount = 0;
    this.session.collectionScore = 0;
    this.session.stones = [];
    this.finished = false;
  }
}
