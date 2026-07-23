import { BesedniceScene } from "./BesedniceScene.js";

export class BesedniceSlaviaBridgeScene extends BesedniceScene {
  constructor(options) {
    super(options);
    this.ensureSlaviaRegistered = options.ensureSlaviaRegistered;
  }

  showResult() {
    this.resultShown = true;
    this.session.setPhase("complete");
    this.levelComplete = Object.freeze({ levelId: "besednice", nextLevelId: "slavia", score: this.session.state.score });
    this.app.input.reset("besednice-complete");
    this.screens.showLevelResult({
      kicker: "BESEDNICE DOKONČENA",
      title: "Ježek je zpět ve sbírce",
      text: "Tři stopy odkryly ježkovou vrstvu a Karel odchází bez cizího nálezu.",
      score: this.session.state.score,
      stats: [
        { label: "STOPY", value: `${this.clueCount()}/3` },
        { label: "KOPÁNÍ", value: `${this.totalDigHits}/3` },
        { label: "JEŽEK", value: this.hasHedgehog() ? "ANO" : "NE" },
        { label: "KAREL", value: this.app.world.get(this.karelEntity, "boss")?.defeated ? "PORAŽEN" : "AKTIVNÍ" }
      ],
      buttonLabel: "POKRAČOVAT DO SLAVIE",
      onContinue: () => {
        this.ensureSlaviaRegistered();
        this.app.changeScene("slavia").catch(error => console.error("Scene transition:", error));
      }
    });
  }
}
