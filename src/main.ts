import "./styles.css";
import { Game } from "./app/Game";

void boot().catch((error: unknown) => {
  showStartupError(error);
});

async function boot(): Promise<void> {
  await registerServiceWorker();

  const root = document.querySelector<HTMLElement>("#game-root");
  const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");

  if (!root || !canvas) {
    throw new Error("Kořenové prvky hry nebyly nalezeny.");
  }

  try {
    const game = new Game(root, canvas);
    try {
      await game.initialize();
    } catch (error: unknown) {
      game.dispose();
      throw error;
    }
  } catch (error: unknown) {
    showStartupError(error);
  }
}

function showStartupError(error: unknown): void {
  const message = error instanceof Error ? error.message : "Neznámá chyba";
  const introPanel = document.querySelector<HTMLElement>(".intro-panel");

  if (introPanel) {
    introPanel.innerHTML = `
      <span class="eyebrow">CHYBA PŘI SPUŠTĚNÍ</span>
      <h1>Hru se nepodařilo načíst</h1>
      <p>${escapeHtml(message)}</p>
      <button class="primary-button" type="button" onclick="location.reload()">Načíst znovu</button>
    `;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#039;",
      '"': "&quot;",
    };

    return entities[character] ?? character;
  });
}

async function registerServiceWorker(): Promise<void> {
  if (
    !import.meta.env.PROD ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, 1200)),
    ]);
  } catch (error: unknown) {
    console.warn("Offline režim se nepodařilo aktivovat.", error);
  }
}
