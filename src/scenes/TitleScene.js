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
    this.screens.showTitle();
    this.document.getElementById("continueButton").classList.add("hidden");
    this.document.getElementById("recordsButton").classList.add("hidden");
    this.document.querySelector(".version").textContent = "v6.0 · Modular Bootstrap";

    this.document.getElementById("playButton").addEventListener("click", event => {
      event.preventDefault();
      this.onStart();
    }, { signal });
    this.document.getElementById("howButton").addEventListener("click", event => {
      event.preventDefault();
      this.screens.show("howScreen", { playing: false });
    }, { signal });
    this.document.getElementById("closeHowButton").addEventListener("click", event => {
      event.preventDefault();
      this.screens.showTitle();
    }, { signal });
  }

  async exit() {
    this.controller?.abort();
    this.controller = null;
  }

  async dispose() {
    await this.exit();
  }
}
