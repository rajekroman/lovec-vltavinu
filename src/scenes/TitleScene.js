export class TitleScene {
  constructor(options) {
    this.document = options.document;
    this.screens = options.screens;
    this.onStart = options.onStart;
    this.controller = null;
  }

  async enter() {
    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.helpOpen = false;
    this.overlayOpen = false;
    this.screens.showTitle();
    this.document.querySelector(".version").textContent = "v7.0 · Čtyři lokality";

    this.document.getElementById("playButton").addEventListener("click", event => {
      event.preventDefault();
      this.onStart();
    }, { signal });
    this.document.getElementById("howButton").addEventListener("click", event => {
      event.preventDefault();
      this.helpOpen = true;
      this.screens.show("howScreen", { playing: false });
    }, { signal });
    this.document.getElementById("closeHowButton").addEventListener("click", event => {
      event.preventDefault();
      this.helpOpen = false;
      this.screens.showTitle();
    }, { signal });
    this.document.getElementById("storyButton").addEventListener("click", event => {
      event.preventDefault();
      this.overlayOpen = true;
      this.screens.showStory({ onClose: () => { this.overlayOpen = false; this.screens.showTitle(); } });
    }, { signal });
    this.document.getElementById("settingsButton").addEventListener("click", event => {
      event.preventDefault();
      this.overlayOpen = true;
      this.screens.showSettings({ onClose: () => { this.overlayOpen = false; this.screens.showTitle(); } });
    }, { signal });
    this.document.addEventListener("keydown", event => {
      if (event.key !== "Escape" || (!this.helpOpen && !this.overlayOpen)) return;
      event.preventDefault();
      this.helpOpen = false;
      this.overlayOpen = false;
      this.screens.showTitle();
    }, { signal });
  }

  async exit() {
    this.controller?.abort();
    this.controller = null;
    this.helpOpen = false;
    this.overlayOpen = false;
  }

  async dispose() {
    await this.exit();
  }
}
