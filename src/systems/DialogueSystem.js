// Dialogue system with character personality and narrative depth
export class DialogueSystem {
  constructor(document, options = {}) {
    this.document = document;
    this.callbacks = new Map();
    this.currentDialogue = null;
  }

  register(callback) {
    this.callbacks.set(callback.name || `callback-${Date.now()}`, callback);
  }

  async show({ character, lines, choices = null }) {
    return new Promise((resolve) => {
      this.currentDialogue = { character, lines: [...lines], choices, resolve };
      this.displayNext();
    });
  }

  displayNext() {
    if (!this.currentDialogue) return;

    const { lines, character } = this.currentDialogue;
    if (lines.length === 0) {
      this.handleComplete();
      return;
    }

    const line = lines.shift();
    this.renderLine(character, line);
  }

  renderLine(character, line) {
    // Render character portrait + dialogue text with typewriter effect
    // This will be hooked into ScreenController.js
    const event = new CustomEvent('dialogue:show', {
      detail: { character, text: line }
    });
    this.document.dispatchEvent(event);
  }

  handleComplete() {
    const { resolve, choices } = this.currentDialogue;
    if (choices && choices.length > 0) {
      this.showChoices(choices, resolve);
    } else {
      resolve(null);
      this.currentDialogue = null;
    }
  }

  showChoices(choices, resolve) {
    const choiceEvent = new CustomEvent('dialogue:choices', {
      detail: { choices }
    });
    this.document.dispatchEvent(choiceEvent);

    // Wait for choice selection
    this.document.addEventListener('dialogue:chosen', ({ detail }) => {
      resolve(detail.choice);
      this.currentDialogue = null;
    }, { once: true });
  }
}

// Dialogue data by character
export const DIALOGUES = {
  farmer: {
    name: "Václav, hospodář",
    portrait: "👨‍🌾",
    personality: "Pragmatic, no-nonsense",
    lines: {
      introduction: "Ahoj! Chceš něco kopat? Najdi si svůj kus, ale mimo brázdy a každou díru zahrň!",
      permission_granted: "Dobře, můžeš kopat. Drž se ale tmavých brázd. Traktor tu projede znovu a já se chci koukat, aby všechno bylo v pořádku.",
      leaving: "Ať se ti daří. Řeknu i ostatním hospodářům o tobě.",
      impressed: "Slyšel jsem o tobě od ostatních. Pokud se rozhodneš znovu, vítejte.",
    }
  },

  forester: {
    name: "Martin, lesník",
    portrait: "👨‍🌲",
    personality: "Professional, cautious",
    lines: {
      introduction: "V lese je třeba pořádek. Vykopeš, ale hned to zasypaš. Nic tu nesmí zůstat.",
      knowledge_test: "Než tě pustím, musím vědět, jestli to vůbec chápete. Vltavín poznáte?",
      permission_granted: "Dobře. Tady jsou tři místa. Postupuj opatrně a bez zbytečných otvorů.",
      inspection: "Zkontroluju... Hmm, přijatelné. Bezpečný přístup, bez poškození. Dalšímu to řeknu.",
      fail: "Tohle je neakceptabilní. Příliš mnoho otvorů. Další průzkumy tu nejsou možné.",
    }
  },

  karel: {
    name: "Krystalový Karel",
    portrait: "😈",
    personality: "Aggressive competitor",
    lines: {
      confrontation: "Hele, tento kus je MŮJ! Já jsem tu první a já si to vezmu!",
      challenge: "Pokud chceš vltavín, musíš mě porazit. Fyzicky i duševně. Jde mi o respekt.",
      taunt: "Vidím, že se chceš pokusit. Varovní: já jsem tu už třikrát kopat.",
      defeat: "Hm... Neočekával jsem to. Máš respekt. Jdi si pro svůj kámen. Možná se tu potkáme znovu.",
      respect: "Nejsi jen náhodný sebou spokojený sběratel. Myslím, že máš potenciál.",
    }
  },

  franta: {
    name: "Feták Franta",
    portrait: "🤏",
    personality: "Scammer, persuasive",
    lines: {
      offer: "Psst! Slyšel jsem, že máš už nějaké vltavíny. Poslouchej, já ti dám nejhezčích deset - všechny super kvalita!",
      temptation: "Podívej, všichni to tak dělají. Porota se nikdy nedoví. Užij si slávu a peníze! Co takhle?",
      sales_pitch: "Jsou to opravdu vltavíny, věř mi. Mám je od důvěryhodného zdroje. Cena bude spravedlivá.",
      refuse_reaction: "Tvoje ztráta, chytrale. Ale respekt za čestnost. Málo lidí má tuhle morálku.",
      accept_reaction: "Hehe! Věděl jsem, že jsi chytrý. Tady jsou tvoje kameniny. Teď si užij slávu!",
      confrontation: "Slyšel jsem, že jsi je vzal. Neboj, tvůj tajemství je bezpečné. Ale pamatuj si, já to vím.",
    }
  },

  jury: {
    name: "Porota v Kulturním domě Slávie",
    portrait: "👥",
    personality: "Authoritative, evaluating",
    lines: {
      introduction: "Vítáme tě v Kulturním domě Slávie. Tvoje sbírka bude podrobně posouzena.",
      evaluation_excellent: "Vynikající! Máš všechny typy, velmi vyvážená sbírka. A dokumentace? Bezchybná. To je práce profesionála.",
      evaluation_good: "Slušně! Máš zajímavé kusy. Dokumentace je v pořádku. Poznáš se, že jsi sběratel svědomitý.",
      evaluation_weak: "Hmm, je to zajímavé, ale chybí ti rozmanitost. A kde jsou poznámky k nálezům? Bez provenance se to neposuzuje.",
      evaluation_suspicious: "Zajímavá sbírka, ale máme obavy z autenticity. Kde přesně jsi je našel? Některé kusy vypadají podezřele.",
      final_ethical: "Finálně: Toto jsou kameny historického zisku a vědecké úcty. Navíc vidíme, že jsi dodržel etické principy. Gratulujeme!",
      final_corrupt: "Finálně: Sbírka je zajímavá, ale integritu nemůžeme potvrdit. Doporučujeme další ověření.",
    }
  }
};

// Story progression tied to decisions
export const STORY_BRANCHES = {
  ethical: {
    description: "Hráč si zachoval etiku",
    dialogues: {
      vaclav_final: "Slyšel jsem o tobě od ostatních. Děkuju, že si máš vážení.",
      jury_bonus: "+15% respekt za zodpovědnost"
    }
  },

  corrupt: {
    description: "Hráč podvedl",
    dialogues: {
      jury_penalty: "Zajímavá sbírka, ale máme obavy z autenticity.",
      franta_reference: "Slyšeli jsme, že sis pomohl od Franty...",
    }
  }
};
