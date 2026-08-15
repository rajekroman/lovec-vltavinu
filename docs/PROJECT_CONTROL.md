# PROJECT_CONTROL.md — aktuální V7 řídicí registr

Revize: **2.19.0 · 15. 8. 2026**
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr aktuální práce. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`. Historická evidence zůstává auditovatelná v Git historii, uzavřených issues/PR a GitHub Releases.

## 1. Aktuální ověřená realita

- Jediná publikovatelná větev je `main`.
- Governance base této revize je `main@e380438f06675a333bc53bcaa6e6a4e0218cce2c`, squash merge PR **#214**. Jde o auditní základ, nikoli samo-referenční požadavek na budoucí HEAD.
- Runtime zachovává jeden Three.js `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden `InputManager`, jeden manifest-driven `AssetLoader` a jednu in-memory `GameSession`.
- Kanonické levely jsou přesně `chlum → nesmen → besednice → slavia`.
- **Chlum V7 je COMPLETED / MERGED / VISUALLY APPROVED** v issue #207 / PR #208.
- Schválený Chlum feature head je `b2c455862a629c78189981ea4c04ea9f661ab6dc`; merge SHA je `90989d82e84680b001319c45ac77112e1104f8db`.
- Exact-head CI #1420 / workflow `31905954518` je zelené: statická a unit gate **211/211 PASS**, browser matrix **6/6 PASS**.
- **Nesměň V7 je COMPLETED / MERGED / VISUALLY APPROVED** v issue #213 / PR #214.
- Schválený Nesměň feature head je `54984cb3b0c7a7a2a5a1730be8b84ee432aeb5a4`; merge SHA je `e380438f06675a333bc53bcaa6e6a4e0218cce2c`.
- Exact-head CI #1428 / workflow `31908124211` je zelené: statická a unit gate **212/212 PASS**, browser matrix **PASS**.
- Governance transition vlastní issue **#215** a větev **`agent/v7-governance-besednice`**.
- Po merge navázaného governance PR je jediný odemčený další milestone **Besednice V7**. Slavia zůstává **FROZEN**.

## 2. Neměnné invarianty

| Oblast | Závazné rozhodnutí |
|---|---|
| Repozitář | pouze `rajekroman/lovec-vltavinu` |
| Produkční větev | pouze `main` |
| Runtime | ES moduly + Three.js |
| Renderer / kamera | právě jeden `WebGLRenderer` a jedna `OrthographicCamera` |
| Simulace | jeden fixed-step loop, 60 Hz, max delta 100 ms, max 5 substepů |
| Session | jedna in-memory `GameSession` |
| Produkční vstup | pouze `src/bootstrap.js` |
| Assety | pouze manifest-driven preload z `assets/manifests/assets.json` |
| UI | HTML/CSS overlay, není autoritou gameplay stavu |
| Levely | Chlum → Nesměň → Besednice → Slavia |
| Ovládání | směrový vstup + jedno kontextové tlačítko `AKCE` |
| Chlum | povrchové hledání/radar, bez kopacího modalu |
| Nesměň | rytmické kopání, přesně 3 úspěšné zásahy |
| Persistence / inventář | žádný save/localStorage gameplay stav ani inventářové UI |
| Legacy | žádný Canvas gameplay runtime, `game.js`, `runtime-stability.js` ani legacy save |
| Release | nový tag pouze ze schváleného `main` po samostatné QA/release gate |

Porušení kteréhokoli bodu je blocker.

## 3. Aktuální pracovní proudy

| Proud | Stav | Povolená akce |
|---|---|---|
| A0 koordinace | **#215 ACTIVE** | zaznamenat Nesměň approval a odemknout jediný Besednice proud |
| V7 Chlum | **#207 / PR #208 COMPLETED** | jen regresní opravy v samostatném issue |
| V7 Nesměň | **#213 / PR #214 COMPLETED** | jen regresní opravy v samostatném issue |
| V7 Besednice | **NEXT po merge governance PR #215** | jeden nový issue, jedna větev `agent/<jedno-tema>`, jeden draft PR z aktuálního `main` |
| Gameplay/data | **Besednice single-stream** | zachovat stopy, třízásahové kopání, střet s Karlem a návrat ježka |
| Grafika/assety | **Besednice single-stream** | pouze produkční Besednice terrain/actor/occlusion assety |
| UI/mobil | **Besednice single-stream** | pouze Besednice-scoped kompozice/HUD |
| QA | **SUPPORT Besednice** | validátor, unit, čtyřlevelový flow, desktop + iPhone portrait/landscape |
| Release | **BLOCKED** | žádný V7 release před schválením všech čtyř levelů |
| V7 Slavia | **FROZEN** | bez V7 implementace do schválení Besednice |

Nevznikají paralelní „finální“ větve. Besednice se zahájí až po merge governance PR navázaného na #215 a její nový issue bude jedinou autoritou přesného rozsahu.

## 4. Uzavřený Chlum V7 baseline

PR #208 dokončil nerepetitivní terrain plate, konzistentní hunter/Václav art, skutečné action frames, integrovaný traktor, foreground/occlusion, kamerové bounds a mobilní kompozici při zachování flow:

```text
Václav → povolení → radar → odhalení → sebrání → dokončení → Nesměň
```

Exact-head evidence:

- workflow `31905954518`, CI #1420 — **SUCCESS**;
- validator **0 errors / 0 warnings**, syntax **PASS**, unit **211/211 PASS**;
- Playwright/browser matrix **6/6 PASS**;
- desktop full four-level flow **PASS**;
- iPhone portrait real-touch/lifecycle a full flow **PASS**;
- iPhone landscape full flow **PASS**;
- statický artifact `9252338505`, digest `sha256:079b83b8730e01d47839a123b0930ff0b291c25ac0d4a8152bc38b0f3238c969`;
- browser artifact `9252478658`, digest `sha256:2cd2b4fdcd50e2066dae73bfaba2e77dd38a11d9cfd875c9e80bed6392f161b3`;
- screenshot review desktop, iPhone portrait a iPhone landscape **APPROVED**.

Chlum už není otevřený pracovní proud. Případná regrese vyžaduje vlastní issue.

## 5. Uzavřený Nesměň V7 baseline

PR #214 dokončil rozsáhlý vrstvený les, produkční terrain plate, průhlednou foreground occlusion, kamerové bounds a mobilní kompozici při zachování flow:

```text
Chlum → dialog / lokalizace kopacího místa → rytmické kopání
→ přesně 3 úspěšné zásahy → nález → dokončení → Besednice
```

Exact-head evidence:

- feature head `54984cb3b0c7a7a2a5a1730be8b84ee432aeb5a4`, merge SHA `e380438f06675a333bc53bcaa6e6a4e0218cce2c`;
- workflow `31908124211`, CI #1428 — **SUCCESS**;
- validator **0 errors / 0 warnings**, unit **212/212 PASS**;
- kompletní Playwright/browser matrix **PASS**;
- statický artifact `9252907599`, digest `sha256:10b457013e7064455093b408eec69413659c3d5befc79cbd17f0dfe885e4ac24`;
- browser artifact `9253022366`, digest `sha256:42b746666a42a6499fcb39c97d93817757333abd79b812fa7e4ac97365fc4613`;
- screenshot review desktop, iPhone portrait a iPhone landscape **APPROVED**.

Nesměň už není otevřený pracovní proud. Případná regrese vyžaduje vlastní issue.

## 6. Odemčený milestone — Besednice V7

### 6.1 Cíl a gameplay

Předělat Besednici na čitelný, prostorově členěný jílový lom s erodovanými stěnami, mokrým dnem a věrohodným ježkovým profilem při zachování:

```text
vstup z Nesměně
→ nalezení 3 stop
→ odemčení ježkového profilu
→ rytmické kopání
→ přesně 3 úspěšné zásahy
→ nález ježka
→ střet s Karlem a bezpečný návrat ježka
→ dokončení Besednice a přechod do Slávie
```

### 6.2 Povolený rozsah budoucího PR

- jeden samostatný Besednice issue s přesným scope a acceptance criteria;
- Besednice scene/data vazby pouze pro vizuální integraci bez redesignu objectives;
- zpětně kompatibilní renderer/camera/animation změny jen při prokázané nutnosti;
- Besednice terrain, Karel, finding a foreground/occlusion assety s úplným manifest metadata kontraktem;
- Besednice-scoped CSS/HUD kompozice a service-worker cache nových lokálních URL;
- cílené unit/contract testy a rozšířená čtyřlevelová Playwright/visual matice.

### 6.3 Vizuální kontrakt

1. Nerepetitivní autorská terrain plate jílového lomu, ne opakovaná 64px textura.
2. Čitelné vrstvy písku, jílu a štěrku, erozní stěny, koleje, kaluže a mokré dno vytvářejí prostorovou hloubku.
3. Foreground hrany výkopu, balvany a vegetace tvoří skutečnou occlusion, ale nezakrývají povinné cíle.
4. Všechny tři stopy, ježkový profil i Karel jsou vizuálně rozlišitelní a bezpečně dosažitelní.
5. Hráč, Karel, nález a efekty sdílejí perspektivu, světlo, měřítko a materiálový styl.
6. Kamera neukáže prostor mimo bounds a zachová jasné průchozí koridory.
7. HUD/dialogy neblokují hráče, stopy, kopací místo, Karla ani únikovou trasu.
8. Desktop a oba iPhone viewporty používají stejný world scale s kompozičním tuningem.
9. Chlum a Nesměň baseline i Slavia přechod zůstávají funkčně regresně zelené.
10. Žádný provizorní ani expirovaný remote asset není produkční art.

### 6.4 Povinná exact-head gate

Před změnou Besednice PR z draftu na ready musí existovat:

1. repository-owned produkční raster assety se stabilními relativními URL;
2. manifestové ID, typ, rozměr, byte/texture budget, SHA-256 a `disposeOwner`;
3. validator **0 errors / 0 warnings** a kompletní unit suite PASS;
4. čtyřlevelový Playwright full-flow PASS;
5. desktop, iPhone portrait a iPhone landscape gameplay/lifecycle PASS;
6. screenshot evidence minimálně `1280×720`, `390×844` a `844×390`;
7. ruční visual review bez černých okrajů, ořezu aktérů, nečitelných cílů a mobilních blockerů;
8. zachované tři stopy, třízásahové kopání, střet s Karlem a přechody Nesměň → Besednice → Slavia;
9. potvrzení bez save, inventáře, druhého rendereru/kamery/loopu/session;
10. A0 visual approval, až potom ready-for-review a případný squash merge.

Automatický merge feature PR je zakázán.

## 7. Integrační pořadí V7

```text
#207 / PR #208 Chlum — COMPLETED / MERGED / APPROVED
→ #211 / PR #212 governance transition — COMPLETED
→ #213 / PR #214 Nesměň — COMPLETED / MERGED / APPROVED
→ #215 governance transition — ACTIVE
→ samostatný V7 Besednice issue/PR
→ exact-head QA + desktop/iPhone screenshot review
→ Besednice approval + případný merge
→ samostatný V7 Slavia issue/PR
→ celoproduktový QA
→ samostatná release gate
→ release pouze z main
```

Žádný level nesmí přeskočit přímou schválenou závislost.

## 8. Historická release identita — neměnit

| Release | Stav / známý target |
|---|---|
| `v6.0.0` | target `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9` |
| `v6.1.0` | merge SHA `745109103722646b69ad5b514d66f9882662ecb9` |
| `v6.2.0` | merge SHA `0175ff8483b24de73e835d005cb60d1338c0a491` |
| `v6.3.0` | aktuální pre-V7 release; target `f16d5e2aaf7c47752de4c6e6f903924d485837c3` |

V7 práce nesmí retagovat žádný z těchto tagů ani přepisovat jejich evidence.

## 9. Povinné reportování

Před změnou: identifikátor úkolu, role, oblast, načtené revize, base SHA, větev, závislosti a konflikty.

Po změně musí HANDOFF uvést: issue/PR/větev, base/head SHA, změněné soubory a kontrakty, technická rozhodnutí, testy, mobilní důkaz, výkon/asset budget, známé problémy, potvrzení bez save/inventáře/druhého runtime a doporučený další krok.

Označení „hotovo“ je povoleno pouze pro konkrétní ověřitelný výstup.
