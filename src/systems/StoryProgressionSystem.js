// Story progression and decision tracking system

export const CHARACTER_STATES = {
  NEUTRAL: "neutral",
  APPROVING: "approving",
  DISAPPROVING: "disapproving",
  HOSTILE: "hostile",
  FRIENDLY: "friendly"
};

export const DECISION_TYPES = {
  PERMISSION_GRANTED: "permission_granted",
  PERMISSION_REFUSED: "permission_refused",
  ETHICAL_CHOICE: "ethical_choice",
  UNETHICAL_CHOICE: "unethical_choice",
  KNOWLEDGE_TEST: "knowledge_test",
  BOSS_DEFEATED: "boss_defeated",
  BOSS_LOST: "boss_lost",
  FRANTA_ACCEPTED: "franta_accepted",
  FRANTA_REFUSED: "franta_refused"
};

export class StoryProgressionSystem {
  constructor(options = {}) {
    this.storageAdapter = options.storageAdapter;
    this.currentBranch = "ethical"; // ethical or corrupt
    this.characterStates = new Map();
    this.decisions = [];
    this.reputationScore = 0;
    this.findingsQuality = [];
    this.loadProgress();
  }

  loadProgress() {
    if (!this.storageAdapter) return;
    const saved = this.storageAdapter.load?.();
    if (saved?.storyProgress) {
      const progress = saved.storyProgress;
      this.currentBranch = progress.branch || "ethical";
      this.reputationScore = progress.reputation || 0;
      this.decisions = progress.decisions || [];
      this.findingsQuality = progress.findings || [];
    }
  }

  saveProgress() {
    if (!this.storageAdapter) return;
    this.storageAdapter.save?.({
      storyProgress: {
        branch: this.currentBranch,
        reputation: this.reputationScore,
        decisions: this.decisions,
        findings: this.findingsQuality
      }
    });
  }

  recordDecision(decision) {
    if (!DECISION_TYPES[decision.type]) return;

    const record = {
      type: decision.type,
      character: decision.character,
      timestamp: Date.now(),
      level: decision.level,
      impact: 0
    };

    // Calculate impact on story branch and reputation
    switch (decision.type) {
      case DECISION_TYPES.ETHICAL_CHOICE:
        this.currentBranch = "ethical";
        this.reputationScore += 10;
        record.impact = 10;
        break;

      case DECISION_TYPES.UNETHICAL_CHOICE:
        this.currentBranch = "corrupt";
        this.reputationScore -= 10;
        record.impact = -10;
        break;

      case DECISION_TYPES.PERMISSION_GRANTED:
        this.reputationScore += 5;
        record.impact = 5;
        this.updateCharacterState(decision.character, CHARACTER_STATES.APPROVING);
        break;

      case DECISION_TYPES.PERMISSION_REFUSED:
        this.reputationScore -= 5;
        record.impact = -5;
        this.updateCharacterState(decision.character, CHARACTER_STATES.DISAPPROVING);
        break;

      case DECISION_TYPES.FRANTA_ACCEPTED:
        this.currentBranch = "corrupt";
        this.reputationScore -= 15;
        record.impact = -15;
        this.updateCharacterState("franta", CHARACTER_STATES.FRIENDLY);
        break;

      case DECISION_TYPES.FRANTA_REFUSED:
        this.currentBranch = "ethical";
        this.reputationScore += 15;
        record.impact = 15;
        this.updateCharacterState("franta", CHARACTER_STATES.NEUTRAL);
        break;

      case DECISION_TYPES.BOSS_DEFEATED:
        this.reputationScore += 20;
        record.impact = 20;
        this.updateCharacterState(decision.character, CHARACTER_STATES.FRIENDLY);
        break;

      case DECISION_TYPES.BOSS_LOST:
        this.reputationScore -= 15;
        record.impact = -15;
        this.updateCharacterState(decision.character, CHARACTER_STATES.HOSTILE);
        break;
    }

    this.decisions.push(record);
    this.saveProgress();
    return record;
  }

  recordFinding(finding) {
    this.findingsQuality.push({
      rarity: finding.rarity || "C",
      location: finding.location || "unknown",
      quality: finding.quality || "normal",
      timestamp: Date.now()
    });
    this.saveProgress();
  }

  updateCharacterState(characterKey, state) {
    if (!CHARACTER_STATES[state]) return;
    this.characterStates.set(characterKey, state);
  }

  getCharacterState(characterKey) {
    return this.characterStates.get(characterKey) || CHARACTER_STATES.NEUTRAL;
  }

  getDialogueVariant(characterKey, baseDialogueKey) {
    // Return different dialogue based on character state and story branch
    const state = this.getCharacterState(characterKey);
    const branch = this.currentBranch;

    // Map to variant keys
    const variants = {
      [`${characterKey}_${baseDialogueKey}_${state}_${branch}`]: true,
      [`${characterKey}_${baseDialogueKey}_${state}`]: true,
      [`${characterKey}_${baseDialogueKey}_${branch}`]: true,
      [baseDialogueKey]: true
    };

    return Object.keys(variants).find(v => v !== "true");
  }

  calculateFinalScore() {
    // Evaluate collection quality
    let collectionQuality = 0;
    const rarityWeights = { A: 10, B: 6, C: 2 };

    this.findingsQuality.forEach(finding => {
      collectionQuality += rarityWeights[finding.rarity] || 0;
    });

    // Score formula
    const authenticity = collectionQuality * 1.0;
    const provenance = this.decisions.length * 0.8; // Well-documented journey
    const balance = Math.min(this.findingsQuality.length * 2, 30) * 0.8;
    const respect = Math.max(this.reputationScore, 0) * 1.5;

    const finalScore = Math.round(authenticity + provenance + balance + respect);

    return {
      score: finalScore,
      authenticity,
      provenance,
      balance,
      respect,
      branch: this.currentBranch,
      reputation: this.reputationScore
    };
  }

  getFinaleMessages() {
    const score = this.calculateFinalScore();
    const messages = {
      character: "Porota",
      title: this.currentBranch === "ethical" ? "ETICKÁ SBÍRKA" : "PODEZŘELÁ SBÍRKA",
      messages: []
    };

    // Generate message based on score and branch
    if (this.currentBranch === "ethical") {
      if (score.score > 100) {
        messages.messages.push("Výjimečná sbírka! Vidíme, že jsi dodržel všechny etické principy.");
        messages.messages.push("Tvá dokumentace je bezchybná a sbírka je vědecky zajímavá.");
        messages.title = "MISTR SBĚRATELE";
      } else if (score.score > 60) {
        messages.messages.push("Slušná práce! Tvá sbírka je vyvážená a eticky správná.");
        messages.messages.push("Ocjujeme tvůj odpovědný přístup k sběratelství.");
        messages.title = "ZODPOVĚDNÝ SBĚRATEL";
      } else {
        messages.messages.push("Zajímavá sbírka, ale chybí ti rozmanitost.");
        messages.messages.push("Při příštím pokusu se zaměř na kvalitu, ne na kvantitu.");
      }
    } else {
      messages.messages.push("Zajímavá sbírka, ale máme obavy z autenticity.");
      messages.messages.push("Některé kusy vypadají podezřele podpůrně.");
      messages.title = "PODEZŘELÁ SBÍRKA";

      if (this.decisions.some(d => d.type === DECISION_TYPES.FRANTA_ACCEPTED)) {
        messages.messages.push("Slyšeli jsme zmínky o podvodem...");
      }
    }

    messages.messages.push(
      `\nFinálně: ${score.score} bodů`
    );

    return messages;
  }

  getStoryStats() {
    return {
      decisionsCount: this.decisions.length,
      ethicalChoices: this.decisions.filter(d => d.impact > 0).length,
      unethicalChoices: this.decisions.filter(d => d.impact < 0).length,
      reputation: this.reputationScore,
      branch: this.currentBranch,
      findingsCount: this.findingsQuality.length,
      collectionValue: this.calculateFinalScore().score
    };
  }

  reset() {
    this.currentBranch = "ethical";
    this.characterStates.clear();
    this.decisions = [];
    this.reputationScore = 0;
    this.findingsQuality = [];
    this.saveProgress();
  }
}
