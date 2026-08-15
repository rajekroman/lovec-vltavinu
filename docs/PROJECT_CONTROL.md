# PROJECT_CONTROL.md — aktuální V7 řídicí registr

Revize: **2.18.0 · 15. 8. 2026**
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je jediný autoritativní stavový registr aktuální práce. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`. Historická evidence zůstává auditovatelná v Git historii, uzavřených issues/PR a GitHub Releases.

## 1. Aktuální ověřená realita

- Jediná publikovatelná větev je `main`.
- Governance base této revize je `main@90989d82e84680b001319c45ac77112e1104f8db`, squash merge PR **#208**. Jde o auditní základ, nikoli samo-referenční požadavek na budoucí HEAD.
- Runtime zachovává jeden Three.js `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden `InputManager`, jeden manifest-driven `AssetLoader` a jednu in-memory `GameSession`.
- Kanonické levely jsou přesně `chlum → nesmen → besednice → slavia`.
- **Chlum V7 je COMPLETED / MERGED / VISUALLY APPROVED** v issue #207 / PR #208.
- Schválený Chlum feature head je `b2c455862a629c78189981ea4c04ea9f661ab6dc`; merge SHA je `90989d82e84680b001319c45ac77112e1104f8db`.
- Exact-head CI #1420 / workflow `31905954518` je zelené: statická a unit gate **211/211 PASS**, browser matrix **6/6 PASS**.
- Governance transition vlastní issue **#211** a PR **#212 / `agent/v7-governance-refresh`**.
- Po merge #212 je jediný odemčený další milestone **Nesměň V7**. Besednice a Slavia zůstávají **FROZEN**.

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
| A0 koordinace | **#211 / PR #212 ACTIVE** | zaznamenat Chlum approval a odemknout jediný Nesměň proud |
| V7 Chlum | **#207 / PR #208 COMPLETED** | jen regresní opravy v samostatném issue |
| V7 Nesměň | **NEXT po merge #212** | jeden nový issue, jedna větev `agent/<jedno-tema>`, jeden draft PR z aktuálního `main` |
| Gameplay/data | **Nesměň single-stream** | zachovat kanonický flow a třízásahové rytmické kopání |
| Grafika/assety | **Nesměň single-stream** | pouze produkční Nesměň terrain/actor/occlusion assety |
| UI/mobil | **Nesměň single-stream** | pouze Nesměň-scoped kompozice/HUD |
| QA | **SUPPORT Nesměň** | validátor, unit, čtyřlevelový flow, desktop + iPhone portrait/landscape |
| Release | **BLOCKED** | žádný V7 release před schválením všech čtyř levelů |
| V7 Besednice | **FROZEN** | bez V7 implementace do schválení Nesměně |
| V7 Slavia | **FROZEN** | bez V7 implementace do schválení Nesměně a Besednice |

Nevznikají paralelní „finální“ větve. Nesměň se zahájí až po merge #212 a její issue bude jedinou autoritou přesného rozsahu.

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

## 5. Odemčený milestone — Nesměň V7

### 5.1 Cíl a gameplay

Předělat Nesměň na rozsáhlý vrstvený les s přesvědčivou hloubkou, nikoli malou izolovanou mýtinu, při zachování:

```text
vstup z Chlumu
→ dialog / lokalizace kopacího místa
→ rytmické kopání
→ přesně 3 úspěšné zásahy
→ nález a dokončení Nesměně
→ přechod do Besednice
```

### 5.2 Povolený rozsah budoucího PR

- jeden samostatný Nesměň issue s přesným scope a acceptance criteria;
- Nesměň scene/data vazby pouze pro vizuální integraci bez redesignu objectives;
- zpětně kompatibilní renderer/camera/animation změny jen při prokázané nutnosti;
- Nesměň terrain, NPC a foreground/occlusion assety s úplným manifest metadata kontraktem;
- Nesměň-scoped CSS/HUD kompozice a service-worker cache nových lokálních URL;
- cílené unit/contract testy a rozšířená čtyřlevelová Playwright/visual matice.

### 5.3 Vizuální kontrakt

1. Nerepetitivní autorská lesní terrain plate, ne generická mýtina.
2. Více plánů stromů, světelné průseky, měkké stíny, mech, kapradí a listí.
3. Foreground větve, kmeny a vegetace tvoří skutečnou occlusion, ale nezakrývají cíle.
4. Kopací profily/místa jsou čitelná a bezpečně dosažitelná.
5. Hráč, NPC a efekty sdílejí perspektivu, světlo, měřítko a materiálový styl.
6. Kamera neukáže prostor mimo bounds a zachová jasné průchozí koridory.
7. HUD/dialogy neblokují hráče, NPC, kopací místo ani trasu.
8. Desktop a oba iPhone viewporty používají stejný world scale s kompozičním tuningem.
9. Chlum baseline a pozdější levely zůstávají funkčně regresně zelené.
10. Žádný provizorní ani expirovaný remote asset není produkční art.

### 5.4 Povinná exact-head gate

Před změnou Nesměň PR z draftu na ready musí existovat:

1. repository-owned produkční raster assety se stabilními relativními URL;
2. manifestové ID, typ, rozměr, byte/texture budget, SHA-256 a `disposeOwner`;
3. validator **0 errors / 0 warnings** a kompletní unit suite PASS;
4. čtyřlevelový Playwright full-flow PASS;
5. desktop, iPhone portrait a iPhone landscape gameplay/lifecycle PASS;
6. screenshot evidence minimálně `1280×720`, `390×844` a `844×390`;
7. ruční visual review bez černých okrajů, ořezu aktérů, nečitelných cílů a mobilních blockerů;
8. zachované třízásahové kopání a přechody Chlum → Nesměň → Besednice;
9. potvrzení bez save, inventáře, druhého rendereru/kamery/loopu/session;
10. A0 visual approval, až potom ready-for-review a případný squash merge.

Automatický merge feature PR je zakázán.

## 6. Integrační pořadí V7

```text
#207 / PR #208 Chlum — COMPLETED / MERGED / APPROVED
→ #211 / PR #212 governance transition — ACTIVE
→ samostatný V7 Nesměň issue + draft PR
→ exact-head QA + desktop/iPhone screenshot review
→ Nesměň approval + případný merge
→ samostatný V7 Besednice issue/PR
→ samostatný V7 Slavia issue/PR
→ celoproduktový QA
→ samostatná release gate
→ release pouze z main
```

Žádný level nesmí přeskočit přímou schválenou závislost.

## 7. Historická release identita — neměnit

| Release | Stav / známý target |
|---|---|
| `v6.0.0` | target `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9` |
| `v6.1.0` | merge SHA `745109103722646b69ad5b514d66f9882662ecb9` |
| `v6.2.0` | merge SHA `0175ff8483b24de73e835d005cb60d1338c0a491` |
| `v6.3.0` | aktuální pre-V7 release; target `f16d5e2aaf7c47752de4c6e6f903924d485837c3` |

V7 práce nesmí retagovat žádný z těchto tagů ani přepisovat jejich evidence.

## 8. Povinné reportování

Před změnou: identifikátor úkolu, role, oblast, načtené revize, base SHA, větev, závislosti a konflikty.

Po změně musí HANDOFF uvést: issue/PR/větev, base/head SHA, změněné soubory a kontrakty, technická rozhodnutí, testy, mobilní důkaz, výkon/asset budget, známé problémy, potvrzení bez save/inventáře/druhého runtime a doporučený další krok.

Označení „hotovo“ je povoleno pouze pro konkrétní ověřitelný výstup.
