# PROJECT_CONTROL.md — aktuální V7 řídicí registr

Revize: **2.21.0 · 19. 8. 2026**
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr aktuální práce. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`. Historická evidence zůstává auditovatelná v Git historii, uzavřených issues/PR a GitHub Releases.

## 1. Aktuální ověřená realita

- Jediná publikovatelná větev je `main`.
- Governance base této revize je `main@924d2f8dc7e9c11eef68ca16f9354d0d0d1dccc2`, squash merge governance PR **#222** (uzavírá #221). Jde o auditní základ, nikoli samo-referenční požadavek na budoucí HEAD.
- Runtime zachovává jeden Three.js `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden `InputManager`, jeden manifest-driven `AssetLoader` a jednu in-memory `GameSession`.
- Kanonické levely jsou přesně `chlum → nesmen → besednice → slavia`.
- **Chlum V7 je COMPLETED / MERGED / VISUALLY APPROVED** v issue #207 / PR #208.
- Schválený Chlum feature head je `b2c455862a629c78189981ea4c04ea9f661ab6dc`; merge SHA je `90989d82e84680b001319c45ac77112e1104f8db`.
- Exact-head CI #1420 / workflow `31905954518` je zelené: statická a unit gate **211/211 PASS**, browser matrix **6/6 PASS**.
- **Nesměň V7 je COMPLETED / MERGED / VISUALLY APPROVED** v issue #213 / PR #214.
- Schválený Nesměň feature head je `54984cb3b0c7a7a2a5a1730be8b84ee432aeb5a4`; merge SHA je `e380438f06675a333bc53bcaa6e6a4e0218cce2c`.
- Exact-head CI #1428 / workflow `31908124211` je zelené: statická a unit gate **212/212 PASS**, browser matrix **PASS**.
- **Besednice V7 je COMPLETED / MERGED / VISUALLY APPROVED** v issue #217 / PR #218.
- Schválený Besednice feature head je `6a34038f348472ab30555f6cba4fdeda542afd73`; merge SHA je `38564df54bf93f6267310ad32f340e4066366649`.
- Exact-head CI #1450 / workflow `32288333181` je zelené: validator **0 errors / 0 warnings**, unit **214/214 PASS**, desktop + iPhone portrait + iPhone landscape full-flow **PASS**.
- Besednice statický artifact `9378494134`, digest `sha256:9436f3f6ae32ec4ab63096f5a12437e2c2f8012d33b1218613f4dfc625635e91`; Playwright artifact `9378974857`, digest `sha256:d7241712495f94870817e103905d2370937516199b2ded89fb1db5caf8713ade`.
- Governance transition po Besednici je **COMPLETED** (issue #221 / PR #222).
- **Slavia V7 je IMPLEMENTED / AWAITING A0 VISUAL APPROVAL** ve větvi `claude/vltaviny-game-dev-c73sup`.
- Slavia V7 slice nahrazuje provizorní 768×511 noční plate produkčním `terrain-slavia-event-plate-v7` (1440×880, poměr stran shodný s `bounds` 1800×1100), přidává `foreground-slavia-event-edge-v7` jako samostatnou occlusion vrstvu a bounds-safe `resolveSlaviaV7CameraZoom`.
- Kanonický quest, CrowdRisk hlášení, certifikace i finální hodnocení zůstaly beze změny; nepřibyl save, inventář, druhý renderer, kamera, loop ani session.
- Lokální exact-head evidence této větve: validator **0 errors / 0 warnings**, syntax **PASS**, unit **222/222 PASS**, Playwright matice **desktop 1280×720 + audio lifecycle + iPhone portrait 390×844 + iPhone landscape 844×390 PASS** (screenshoty `slavia-arrival`, `slavia-certification`, `slavia-final-result` ve všech třech viewportech). A0 visual approval a CI exact-head běh zůstávají otevřené.
- Preload kontrakt je nově vynucený: validátor odmítne jakýkoli manifest asset, na který se produkční runtime nikdy neodkáže. Odstraněno **7 mrtvých assetů / 4,26 MB** (Nesměň −2,99 MB, Besednice −0,60 MB, Slavia −0,56 MB stahovaných dat na vstupu do levelu).
- Release zůstává **BLOCKED** do schválení Slavie a následného celoproduktového QA.

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
| Besednice | 3 stopy → ježkový profil → 3 zásahy → ježek → Karel → návrat ježka |
| Persistence / inventář | žádný save/localStorage gameplay stav ani inventářové UI |
| Legacy | žádný Canvas gameplay runtime, `game.js`, `runtime-stability.js` ani legacy save |
| Release | nový tag pouze ze schváleného `main` po samostatné QA/release gate |

Porušení kteréhokoli bodu je blocker.

## 3. Aktuální pracovní proudy

| Proud | Stav | Povolená akce |
|---|---|---|
| A0 koordinace | **#221 / PR #222 COMPLETED** | posoudit Slavia visual slice a rozhodnout o approval |
| V7 Chlum | **#207 / PR #208 COMPLETED** | jen regresní opravy v samostatném issue |
| V7 Nesměň | **#213 / PR #214 COMPLETED** | jen regresní opravy v samostatném issue |
| V7 Besednice | **#217 / PR #218 COMPLETED** | jen regresní opravy v samostatném issue |
| V7 Slavia | **IMPLEMENTED — čeká na A0 visual approval** | pouze opravy vyplývající z visual review a QA; `claude/vltaviny-game-dev-c73sup` staví přímo na schváleném `main`, PR #220 se nepoužil |
| Gameplay/data | **BEZE ZMĚNY** | quest, CrowdRisk i finální certifikační flow zůstaly nedotčené |
| Grafika/assety | **DELIVERED** | `terrain-slavia-event-plate-v7`, `foreground-slavia-event-edge-v7`, generátor `tools/art/build-slavia-v7-art.mjs`, odstranění mrtvého preloadu |
| UI/mobil | **BEZE ZMĚNY** | HUD ani safe-area kompozice se pro Slavii neměnily |
| QA | **SUPPORT Slavia** | validátor, unit (222), čtyřlevelový full-flow, desktop + iPhone portrait/landscape |
| Release | **BLOCKED** | žádný V7 release před schválením Slavie, celoproduktovým QA a samostatnou release gate |

Nevznikají paralelní „finální“ větve. Slavia je implementovaná v jediné větvi `claude/vltaviny-game-dev-c73sup` odvozené přímo ze schváleného `main`; starší issue #219 a draft PR #220 se nepoužily a zůstávají bez autorizace k merge.

### 3.1 Lineage pravidlo pro #219 / PR #220 — VYŘEŠENO

Lineage audit skončil variantou „nová větev z aktuálního `main`“. Slavia V7 je implementovaná v `claude/vltaviny-game-dev-c73sup` s base `main@924d2f8dc7e9c11eef68ca16f9354d0d0d1dccc2`, takže diff neobsahuje žádný pre-fix Besednice stav. Původní pravidlo zůstává platné pro případ, že by někdo chtěl PR #220 oživit:

- #219 může po merge governance PR sloužit jako kanonický Slavia feature issue pouze po aktualizaci zastaralého požadavku na stackování z pre-fix Besednice headu.
- PR #220 má base `agent/v7-besednice-visual-slice` na starším headu `2f0751ed231e8f37451a4cb9d45faad3ff9f07fe`, tedy před finálním Besednice camera fixem a před squash merge #218.
- PR #220 se nesmí pouze naslepo retargetovat nebo mergeovat do `main`. Nejprve musí lineage audit prokázat, že výsledný diff proti `main@38564df54bf93f6267310ad32f340e4066366649` obsahuje pouze autorizovaný Slavia scope a nevrací žádnou schválenou Besednice změnu.
- Pokud čistý lineage nelze prokázat, Slavia změny se převedou na novou větev z aktuálního `main`; stará větev zůstane pouze zdrojem izolovaných částí podle `AGENTS.md`.

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

## 6. Uzavřený Besednice V7 baseline

PR #218 dokončil Besednici jako nerepetitivní, prostorově členěný jílový lom s produkční terrain plate, transparentní foreground/occlusion vrstvou a bounds-safe responsive kamerou při zachování flow:

```text
Nesměň → 3 stopy → ježkový profil → rytmické kopání
→ přesně 3 úspěšné zásahy → nález ježka → střet s Karlem
→ bezpečný návrat ježka → dokončení → Slavia
```

Exact-head evidence:

- feature head `6a34038f348472ab30555f6cba4fdeda542afd73`, merge SHA `38564df54bf93f6267310ad32f340e4066366649`;
- workflow `32288333181`, CI #1450 — **SUCCESS**;
- validator **0 errors / 0 warnings**, syntax **PASS**, unit **214/214 PASS**;
- desktop + iPhone portrait + iPhone landscape full-flow matrix **PASS**;
- statický artifact `9378494134`, digest `sha256:9436f3f6ae32ec4ab63096f5a12437e2c2f8012d33b1218613f4dfc625635e91`;
- Playwright artifact `9378974857`, digest `sha256:d7241712495f94870817e103905d2370937516199b2ded89fb1db5caf8713ade`;
- screenshot review desktop 1280×720, iPhone portrait 390×844 a iPhone landscape 844×390 **APPROVED**;
- původní landscape clear-color side-strip blocker je uzavřen a chráněn cíleným 844×390 frustum regression testem.

Besednice už není otevřený pracovní proud. Případná regrese vyžaduje vlastní issue.

## 7. Slavia V7 — dodaný slice, čeká na approval

### 7.1 Cíl a gameplay

Dokončit poslední kanonickou lokalitu Malše/KD Slavia jako živou venkovní sběratelskou/eventovou plochu, kde je budova KD Slavia rozpoznatelnou sekundární kulisou, nikoli dominantní mapou přes celý viewport. Zachovat stávající quest, CrowdRisk a finální certifikační/výsledkový flow.

### 7.2 Povolený rozsah po merge governance PR #221

- Slavia scene/data vazby nutné pro vizuální integraci bez redesignu kanonického questu;
- repository-owned Slavia terrain plate, foreground/event prvky a pouze nutné actor/prop assety;
- manifest metadata, lifecycle/dispose ownership a service-worker distribuční cache;
- Slavia-scoped CSS/HUD/safe-area kompozice;
- zpětně kompatibilní camera/animation úpravy pouze při prokázané nutnosti;
- cílené unit/contract testy a kompletní čtyřlevelová Playwright/visual matice.

### 7.3 Vizuální kontrakt

1. Hlavní gameplay plocha je venkovní event/sběratelský prostor u Malše; KD Slavia je sekundární rozpoznatelná kulisa.
2. Stánky, sběratelé, vitríny, bannery/vlajky, auta/dodávky a návštěvníci vytvářejí živější finále než přírodní levely.
3. Terrain/event plate je nerepetitivní produkční art bez viditelného tilingu a bez placeholderů.
4. Povinné NPC, dokument/certifikace a finální interakce jsou čitelné, dosažitelné a nejsou zakryté foregroundem ani HUD.
5. Kamera zůstává uvnitř bounds a desktop/portrait/landscape používají stejný world scale s bezpečným kompozičním tuningem.
6. Chlum, Nesměň a Besednice schválené baseline se nesmí změnit ani vizuálně regresovat.
7. Žádný provizorní, expirovaný remote nebo pre-fix stacked asset/runtime není produkční autoritou.

### 7.4 Povinná exact-head gate Slavie

Před A0 approval Slavia feature PR musí existovat:

1. čistý lineage z aktuálního schváleného `main` bez návratu Besednice camera fixu;
2. repository-owned produkční assety se stabilními relativními URL;
3. úplná manifest metadata: ID, typ, rozměr, byte/texture budget, SHA-256 a `disposeOwner`;
4. validator **0 errors / 0 warnings** a kompletní unit suite PASS;
5. kompletní Chlum → Nesměň → Besednice → Slavia full-flow PASS;
6. desktop, iPhone portrait a iPhone landscape gameplay/lifecycle PASS;
7. screenshot evidence minimálně `1280×720`, `390×844` a `844×390`;
8. ruční visual review bez černých okrajů, ořezu aktérů, nečitelných cílů, HUD/touch blockerů a regresí prvních tří levelů;
9. potvrzení bez save, inventáře, druhého rendereru/kamery/loopu/session;
10. A0 visual approval, až potom ready-for-review a případný squash merge.

Automatický merge feature PR je zakázán.

### 7.5 Stav dodávky

Dodáno ve větvi `claude/vltaviny-game-dev-c73sup`:

| Bod gate | Stav |
|---|---|
| čistý lineage ze schváleného `main` | **SPLNĚNO** (base `924d2f8`, žádný Besednice revert) |
| repository-owned produkční assety se stabilními relativními URL | **SPLNĚNO** (`slavia-event-plate-v7.png`, `slavia-event-edge-v7.png`) |
| úplná manifest metadata (ID, typ, rozměr, byte budget, SHA-256, `disposeOwner`) | **SPLNĚNO** |
| validator 0/0 a kompletní unit suite | **SPLNĚNO** (222/222) |
| čtyřlevelový full-flow | **SPLNĚNO** ve všech třech viewportech |
| desktop + iPhone portrait + iPhone landscape | **PASS** (lokální matice; CI exact-head běh po push) |
| screenshot evidence 1280×720 / 390×844 / 844×390 | **SPLNĚNO** (Playwright artefakty) |
| ruční visual review | **OTEVŘENO — vlastní Roman (A0)** |
| bez save, inventáře, druhého rendereru/kamery/loopu/session | **SPLNĚNO** (kontrolováno validátorem i unit testy) |
| A0 visual approval → ready-for-review → squash merge | **OTEVŘENO** |

Neuzavřené body jsou výhradně schvalovací a CI exact-head běh; implementační rozsah Slavie je hotový.

### 7.6 Úklid mrtvého preloadu

Manifest obsahoval assety, které po V7 přestavbě žádný produkční modul nepoužívá, a přesto se stahovaly a cachovaly při vstupu do levelu. Odstraněny byly soubor, manifest položka i záznam v `sw.js`:

| Asset | Level | Ušetřeno |
|---|---|---|
| `terrain-nesmen-reference-clearing-v2` | Nesměň | 2 983 kB |
| `terrain-nesmen-forest-floor` | Nesměň | 5 kB |
| `model-nesmen-tree-stump` | Nesměň | 1 kB |
| `terrain-besednice-clay-quarry-v1` | Besednice | 608 kB |
| `terrain-besednice-quarry` | Besednice | 3 kB |
| `model-besednice-rock` | Besednice | 1 kB |
| `terrain-slavia-malse-exterior-v1` | Slavia | 559 kB |

Celkem **4,26 MB**. Jde výhradně o odstranění nepoužívaných dat: žádná schválená vizuální podoba Chlumu, Nesměně ani Besednice se nemění a plná čtyřlevelová Playwright matice po úklidu prochází.

Pravidlo je nově vynucené v `tools/validate.mjs`: každý asset v manifestu musí být odkazován ID z modulu dosažitelného z `src/bootstrap.js`, jinak validace selže. Historie souborů zůstává auditovatelná v Gitu.

Název distribuční cache se posunul na `lovec-vltavinu-slavia-v6-3-release-2`, aby se u vracejících se hráčů uvolnily i zastaralé záznamy smazaných souborů. Po úklidu prošla kompletní Playwright matice **6/6 PASS** (desktop, audio lifecycle, iPhone portrait, iPhone landscape).

### 7.7 Vizuální omezení plate

Slavia plate je procedurálně malovaný a reprodukovatelný generátorem `tools/art/build-slavia-v7-art.mjs` (viz `docs/ART_PIPELINE.md`). Splňuje kompoziční a měřítková pravidla kontraktu — venkovní eventová plocha, KD Slavia jako sekundární kulisa, nerepetitivní plate, foreground occlusion, čitelné cíle — ale malířskou věrností nedosahuje fotorealistických plate Chlumu, Nesměně a Besednice. Výměna za externě autorovanou malbu je možná beze změny runtime při zachování ID `terrain-slavia-event-plate-v7` a poměru stran `1800:1100`.

## 8. Integrační pořadí V7

```text
#207 / PR #208 Chlum — COMPLETED / MERGED / APPROVED
→ #211 / PR #212 governance transition — COMPLETED
→ #213 / PR #214 Nesměň — COMPLETED / MERGED / APPROVED
→ #215 / PR #216 governance transition — COMPLETED
→ #217 / PR #218 Besednice — COMPLETED / MERGED / APPROVED
→ #221 / PR #222 governance transition — COMPLETED
→ lineage audit #219 / PR #220 — VYŘEŠEN novou větví z main
→ Slavia V7 visual slice v `claude/vltaviny-game-dev-c73sup` — IMPLEMENTED
→ exact-head QA + desktop/iPhone screenshot review — PROBÍHÁ
→ Slavia approval + případný squash merge
→ celoproduktový QA
→ samostatná release gate
→ release pouze z main
```

Žádný level nesmí přeskočit přímou schválenou závislost.

## 9. Historická release identita — neměnit

| Release | Stav / známý target |
|---|---|
| `v6.0.0` | target `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9` |
| `v6.1.0` | merge SHA `745109103722646b69ad5b514d66f9882662ecb9` |
| `v6.2.0` | merge SHA `0175ff8483b24de73e835d005cb60d1338c0a491` |
| `v6.3.0` | aktuální pre-V7 release; target `f16d5e2aaf7c47752de4c6e6f903924d485837c3` |

V7 práce nesmí retagovat žádný z těchto tagů ani přepisovat jejich evidence.

## 10. Povinné reportování

Před změnou: identifikátor úkolu, role, oblast, načtené revize, base SHA, větev, závislosti a konflikty.

Po změně musí HANDOFF uvést: issue/PR/větev, base/head SHA, změněné soubory a kontrakty, technická rozhodnutí, testy, mobilní důkaz, výkon/asset budget, známé problémy, potvrzení bez save/inventáře/druhého runtime a doporučený další krok.

Označení „hotovo“ je povoleno pouze pro konkrétní ověřitelný výstup.
