// Interactive tutorial system for onboarding

export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Vítej, Lovce Vltavínů!",
    content: "Tvůj cíl je sbírat vltavíny - přírodní skla vzniklá pádem meteoritu.",
    action: "Klikni, aby pokračoval"
  },
  {
    id: "concept",
    title: "Co jsou Vltavíny?",
    content: "Vltavíny jsou tektity - přírodní skla z meteoritu. Nacházejí se v Česku a jsou zajímavé pro vědu i sběratele.",
    action: "Pokračuj v táboru"
  },
  {
    id: "controls",
    title: "Ovládání",
    content: "Pohybuj se klávesami WASD nebo dotykový joystick. Tlačítko akce v rohu obrazovky.",
    highlight: ".action-button",
    action: "Teď vyzkoušej!"
  },
  {
    id: "digging",
    title: "Kopání",
    content: "Když najdeš místo pro kopání, drž rytmus! Tři zásahy v zelené zóně = úspěch.",
    action: "Pojď kopat!"
  },
  {
    id: "identification",
    title: "Určování Vltavínů",
    content: "Každý vltavín má jiné vlastnosti: barva, povrch, hrany a bubliny. Nauč se je rozpoznávat!",
    action: "Pokračuj"
  },
  {
    id: "ethics",
    title: "Etika Sběratelství",
    content: "Respektuj přírodu a majitele pozemků. Nech povolení, zasypej díry a zdokumentuj nález.",
    action: "Rozumím"
  },
  {
    id: "encounters",
    title: "Setkání s Postavami",
    content: "Během cesty se setkáš s různými postavami - farmářem, lesníkem a dalšími. Poslouchej jejich rady!",
    action: "Pojďme!"
  }
];

export class TutorialController {
  constructor(document, options = {}) {
    this.document = document;
    this.currentStep = 0;
    this.completed = false;
    this.storagAdapter = options.storageAdapter;
    this.callbacks = new Map();
    this.loadProgress();
  }

  loadProgress() {
    if (!this.storagAdapter) return;
    const saved = this.storagAdapter.load?.();
    if (saved?.tutorialStep) {
      this.currentStep = saved.tutorialStep;
    }
  }

  saveProgress() {
    if (!this.storagAdapter) return;
    this.storagAdapter.save?.({ tutorialStep: this.currentStep });
  }

  start() {
    this.currentStep = 0;
    this.showStep(0);
  }

  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= TUTORIAL_STEPS.length) {
      this.complete();
      return;
    }

    this.currentStep = stepIndex;
    const step = TUTORIAL_STEPS[stepIndex];

    // Create tutorial modal
    const tutorial = this.createTutorialModal(step);
    const existing = this.document.querySelector('.tutorial-modal');
    if (existing) existing.remove();

    this.document.body.appendChild(tutorial);
    this.saveProgress();

    // Highlight specific element if specified
    if (step.highlight) {
      const element = this.document.querySelector(step.highlight);
      if (element) this.highlightElement(element);
    }

    this.callbacks.get('onStepShow')?.(step);
  }

  createTutorialModal(step) {
    const modal = this.document.createElement('div');
    modal.className = 'tutorial-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'tutorial-title');
    modal.setAttribute('aria-describedby', 'tutorial-content');

    modal.innerHTML = `
      <div class="tutorial-backdrop"></div>
      <div class="tutorial-box">
        <div class="tutorial-header">
          <h2 id="tutorial-title">${step.title}</h2>
          <button class="tutorial-close" aria-label="Zavřít tutoriál">×</button>
        </div>
        <div class="tutorial-body">
          <p id="tutorial-content">${step.content}</p>
        </div>
        <div class="tutorial-footer">
          <div class="tutorial-progress">
            Krok ${this.currentStep + 1}/${TUTORIAL_STEPS.length}
          </div>
          <div class="tutorial-buttons">
            ${this.currentStep > 0 ? '<button class="tutorial-prev">← Zpět</button>' : ''}
            <button class="tutorial-next">${step.action}</button>
          </div>
        </div>
      </div>
    `;

    // Bind events
    modal.querySelector('.tutorial-close').addEventListener('click', () => this.skip());
    modal.querySelector('.tutorial-next').addEventListener('click', () => this.next());
    if (modal.querySelector('.tutorial-prev')) {
      modal.querySelector('.tutorial-prev').addEventListener('click', () => this.previous());
    }

    // Prevent background interaction
    modal.addEventListener('click', (e) => {
      if (e.target === modal.querySelector('.tutorial-backdrop')) {
        // Allow clicking outside
      }
    });

    return modal;
  }

  highlightElement(element) {
    element.classList.add('tutorial-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  removeHighlight() {
    const highlighted = this.document.querySelector('.tutorial-highlight');
    if (highlighted) highlighted.classList.remove('tutorial-highlight');
  }

  next() {
    this.removeHighlight();
    this.showStep(this.currentStep + 1);
  }

  previous() {
    this.removeHighlight();
    this.showStep(this.currentStep - 1);
  }

  skip() {
    this.removeHighlight();
    const modal = this.document.querySelector('.tutorial-modal');
    if (modal) modal.remove();
    this.complete();
  }

  complete() {
    this.completed = true;
    this.currentStep = TUTORIAL_STEPS.length;
    this.saveProgress();
    this.callbacks.get('onTutorialComplete')?.(this);
  }

  on(eventName, callback) {
    this.callbacks.set(eventName, callback);
  }
}
