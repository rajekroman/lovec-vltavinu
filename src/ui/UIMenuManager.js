// Comprehensive UI menu and navigation system

export const MENU_SECTIONS = {
  MAIN: "main",
  DIFFICULTY: "difficulty",
  SETTINGS: "settings",
  ABOUT: "about",
  TUTORIAL: "tutorial"
};

export const DIFFICULTY_LEVELS = [
  {
    id: "story",
    name: "PŘÍBĚH",
    description: "Nejlehčí - Poznejte koncept a příběh",
    color: 0x75B98A,
    hazardFactor: 0.3,
    digDifficulty: "easy",
    icon: "📖"
  },
  {
    id: "normal",
    name: "SBĚRATEL",
    description: "Standard - Vybudujte si sbírku",
    color: 0xC7AA6B,
    hazardFactor: 0.7,
    digDifficulty: "normal",
    icon: "💎"
  },
  {
    id: "hard",
    name: "ČERNÁ NOC",
    description: "Těžké - Dokonalá sbírka a etika",
    color: 0xD75F58,
    hazardFactor: 1.0,
    digDifficulty: "hard",
    icon: "⚫"
  }
];

export class UIMenuManager {
  constructor(document, options = {}) {
    this.document = document;
    this.currentSection = MENU_SECTIONS.MAIN;
    this.selectedDifficulty = DIFFICULTY_LEVELS[1]; // Default to normal
    this.callbacks = new Map();
    this.initialized = false;
  }

  initialize() {
    this.bindMenuEvents();
    this.initialized = true;
  }

  bindMenuEvents() {
    // Bind difficulty selection buttons
    const difficultyButtons = this.document.querySelectorAll('[data-difficulty]');
    difficultyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const diffId = e.currentTarget.dataset.difficulty;
        this.selectDifficulty(diffId);
      });
    });

    // Bind settings toggles
    const audioToggle = this.document.querySelector('[data-setting="audio"]');
    if (audioToggle) {
      audioToggle.addEventListener('change', (e) => {
        this.callbacks.get('onAudioToggle')?.(e.currentTarget.checked);
      });
    }

    // Bind menu navigation
    const menuButtons = this.document.querySelectorAll('[data-menu]');
    menuButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.menu;
        this.showSection(section);
      });
    });
  }

  selectDifficulty(difficultyId) {
    const selected = DIFFICULTY_LEVELS.find(d => d.id === difficultyId);
    if (!selected) return;

    this.selectedDifficulty = selected;

    // Update visual selection
    const buttons = this.document.querySelectorAll('[data-difficulty]');
    buttons.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.difficulty === difficultyId);
    });

    this.callbacks.get('onDifficultySelect')?.(selected);
  }

  showSection(sectionId) {
    if (!Object.values(MENU_SECTIONS).includes(sectionId)) return;

    this.currentSection = sectionId;

    // Hide all sections
    const sections = this.document.querySelectorAll('[data-menu-section]');
    sections.forEach(section => {
      section.classList.toggle('visible', section.dataset.menuSection === sectionId);
    });

    this.callbacks.get('onSectionChange')?.(sectionId);
  }

  register(callback) {
    if (typeof callback === 'function' && callback.name) {
      this.callbacks.set(`on${callback.name.charAt(0).toUpperCase() + callback.name.slice(1)}`, callback);
    }
  }

  on(eventName, callback) {
    this.callbacks.set(eventName, callback);
  }

  createDifficultySelector() {
    const container = this.document.createElement('div');
    container.className = 'difficulty-selector';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Výběr obtížnosti');

    DIFFICULTY_LEVELS.forEach(level => {
      const button = this.document.createElement('button');
      button.dataset.difficulty = level.id;
      button.className = `difficulty-option ${level.id === this.selectedDifficulty.id ? 'selected' : ''}`;
      button.innerHTML = `
        <span class="difficulty-icon">${level.icon}</span>
        <strong>${level.name}</strong>
        <p>${level.description}</p>
      `;
      button.addEventListener('click', () => this.selectDifficulty(level.id));
      container.appendChild(button);
    });

    return container;
  }

  createSettingsPanel() {
    const panel = this.document.createElement('div');
    panel.className = 'settings-panel';

    // Audio settings
    const audioSection = this.document.createElement('div');
    audioSection.className = 'settings-section';
    audioSection.innerHTML = `
      <h3>Zvuk</h3>
      <label>
        <input type="checkbox" data-setting="audio" checked />
        Zvuky ve hře
      </label>
      <label>
        Hlasitost: <input type="range" min="0" max="100" value="80" data-setting="volume" />
      </label>
    `;
    panel.appendChild(audioSection);

    // Graphics settings
    const graphicsSection = this.document.createElement('div');
    graphicsSection.className = 'settings-section';
    graphicsSection.innerHTML = `
      <h3>Grafika</h3>
      <label>
        <input type="checkbox" data-setting="effects" checked />
        Vizuální efekty
      </label>
      <label>
        Kvalita:
        <select data-setting="quality">
          <option value="low">Nízká</option>
          <option value="medium" selected>Střední</option>
          <option value="high">Vysoká</option>
        </select>
      </label>
    `;
    panel.appendChild(graphicsSection);

    // Accessibility settings
    const accessSection = this.document.createElement('div');
    accessSection.className = 'settings-section';
    accessSection.innerHTML = `
      <h3>Přístupnost</h3>
      <label>
        <input type="checkbox" data-setting="highcontrast" />
        Vysoký kontrast
      </label>
      <label>
        <input type="checkbox" data-setting="largetext" />
        Větší text
      </label>
    `;
    panel.appendChild(accessSection);

    return panel;
  }

  createAboutPanel() {
    const panel = this.document.createElement('div');
    panel.className = 'about-panel';
    panel.innerHTML = `
      <h2>O HŘE</h2>
      <section>
        <h3>Lovec Vltavínů v7.1</h3>
        <p>Edukativní arkádní hra o sběru vltavínů a etice sběratelství.</p>
        <p><strong>Tématická akce:</strong> Na Zelené Vlně<br/>České Budějovice</p>
      </section>
      <section>
        <h3>O Vltavínech</h3>
        <p>Vltavíny jsou přírodní skla (tektity) vzniklá pádem meteoritu kolem 15 milionů let.</p>
        <p>Nacházejí se v Česku a jsou předmětem vědeckého zájmu i sběratelství.</p>
      </section>
      <section>
        <h3>Tvůrci</h3>
        <p>Vytvořeno pro edukaci a zábavu.<br/>Při sběru respektujte přírodu a vlastníky pozemků.</p>
      </section>
    `;
    return panel;
  }
}

// Enhanced pause menu controller
export class PauseMenuController {
  constructor(document, options = {}) {
    this.document = document;
    this.onResume = options.onResume;
    this.onMenu = options.onMenu;
    this.isPaused = false;
  }

  show(context = {}) {
    this.isPaused = true;
    const level = context.level?.name ?? "Výprava";
    const objective = context.objective ?? "";
    const progress = context.progress ?? 0;

    const pauseScreen = this.document.querySelector('#pauseScreen');
    if (!pauseScreen) return;

    this.document.querySelector('[data-pause="location"]').textContent = level;
    this.document.querySelector('[data-pause="objective"]').textContent = objective;
    this.document.querySelector('[data-pause="progress"]').textContent = `${Math.round(progress * 100)}%`;

    pauseScreen.classList.add('visible');
  }

  hide() {
    this.isPaused = false;
    const pauseScreen = this.document.querySelector('#pauseScreen');
    if (pauseScreen) pauseScreen.classList.remove('visible');
  }
}
