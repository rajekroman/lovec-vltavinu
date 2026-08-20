# PROJECT_CONTROL.md — aktuální V7 řídicí registr

Revize: **2.24.0 · 20. 8. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je autoritativní stručný stavový registr. Detailní historická evidence zůstává v Git historii, issues, PR, GitHub Actions a GitHub Releases. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`.

## 1. Aktuální ověřená realita

- **V7 je publikována jako GitHub Release `v7.0.0`.**
- Tag **`v7.0.0`** resolveuje přesně na commit **`258897cf064194c95c1de629ca83461617e22ed2`** (merge PR #247).
- Release URL: `https://github.com/rajekroman/lovec-vltavinu/releases/tag/v7.0.0`.
- Exact-head release gate nad tímto SHA: **Validate game #1528 / run `32376912504` — SUCCESS**.
- Statická validace: **0 chyb / 0 varování**; Slavia production WebP reproduction: **exact PASS**; unit suite: **235/235 PASS**.
- Browser gate na release SHA: desktop full-flow **PASS**, iPhone portrait full-flow **PASS**, iPhone landscape full-flow **PASS**, iPhone portrait touch/HUD/radar smoke **3/3 PASS**, audio lifecycle **PASS**.
- Exact-head release artifacts:
  - static `9409403892` — `sha256:fa26cd7a78835b4867135e06fcd25ef41ddaa91c3fd0f62562a87faf7d7239a7`;
  - audio `9409418943` — `sha256:3612b8e9c5d19b73ab8fa494a4b2099a8ebeb53b3741179048030c68d5ac68c7`;
  - portrait smoke `9409454195` — `sha256:1fdf0f902eadde32c249e60744d5ebe1908889c68cb33b4f8a81b66a0284cdac`;
  - desktop `9409518121` — `sha256:dd1606456759bdaf7d10564c2392f5b75df30461431ba466441206ec4b9c950c`;
  - portrait `9409579703` — `sha256:b744e7903d55aa9b1d75370397285b35c292d274bf82f732aff43d7e7368c7d0`;
  - landscape `9409618935` — `sha256:03f2f0f66ef7c1eba90cc2cb06c635639072dddb08beeb0f0166ac389148eff3`.
- Poslední exact produkční Pages evidence před CI-only sérií je **Pages #127 / run `32367856653`** na `81384f41ae6b59fc0e59a929d6b3945e445b91be`.
- Compare `81384f41ae6b59fc0e59a929d6b3945e445b91be → v7.0.0` obsahuje **20 commitů, ale pouze 3 CI/test soubory**: `.github/workflows/validate.yml`, `playwright.config.mjs`, `tests/unit/besednice-production-contract.test.mjs`. **Žádný gameplay, runtime, produkční UI ani produkční asset se mezi posledním Pages produkčním důkazem a release tagem nezměnil.**
- Aktuální `main` je **`b1865f91b0751fa4292b76a48f9f5cb58a2c615e`**, post-release merge PR #248.
- Compare `v7.0.0 → main` mění pouze odstranění `.github/workflows/npm-publish-github-packages.yml`. PR #248 je **post-release CI cleanup**; obsah vydaného `v7.0.0` nemění.
- Repo má jeden autoritativní Pages workflow: `.github/workflows/pages.yml`.
- Release gate issue **#226 zůstává otevřené pouze kvůli explicitnímu governance/ručnímu vizuálnímu uzavření**. Automatická release evidence je splněná.

## 2. Neměnné runtime invarianty

| Oblast | Závazné rozhodnutí |
|---|---|
| Repozitář | pouze `rajekroman/lovec-vltavinu` |
| Produkční větev | `main` |
| Runtime | ES moduly + Three.js |
| Renderer / kamera | právě jeden `WebGLRenderer` a jedna `OrthographicCamera` |
| Simulace | jeden fixed-step loop |
| Vstup | jeden `InputManager` |
| Session | jedna in-memory `GameSession` |
| Produkční vstup | `src/bootstrap.js` |
| Assety | manifest-driven preload z `assets/manifests/assets.json` |
| UI | HTML/CSS overlay; není autoritou gameplay stavu |
| Levely | Chlum → Nesměň → Besednice → Slavia |
| Chlum | povrchové hledání + skutečný scan/radar |
| Nesměň | rytmické kopání, přesně 3 úspěšné zásahy |
| Besednice | 3 stopy → profil → 3 zásahy → ježek → Karel → návrat |
| Slavia | event/certifikace/final evaluation flow |
| Persistence | žádný save/localStorage/sessionStorage/indexedDB gameplay stav |
| Legacy | žádný Canvas gameplay runtime ani legacy save vrstva |

Porušení kteréhokoli bodu je regresní blocker a vyžaduje samostatné issue/PR.

## 3. V7 stav podle lokalit

| Lokalita | Stav | Autoritativní evidence |
|---|---|---|
| Chlum | **COMPLETED / MERGED / APPROVED** | #207 / PR #208; HUD + radar krytý release gate |
| Nesměň | **COMPLETED / MERGED / APPROVED** | #213 / PR #214 |
| Besednice | **COMPLETED / MERGED / APPROVED** | #217 / PR #218 |
| Slavia | **COMPLETED / MERGED / APPROVED** | #219 / PR #224; WebP pipeline blocker #232 uzavřen |
| Celoproduktové QA | **AUTOMATION PASS** | release SHA `258897cf...`, run `32376912504` |
| Release | **PUBLISHED** | tag + GitHub Release `v7.0.0` |
| Ruční vizuální audit | **NEUZAVŘEN V #226** | vyžaduje explicitní lidské potvrzení nebo explicitní rozhodnutí audit vynechat |

## 4. Release `v7.0.0` — neměnná identita

```text
version: v7.0.0
tag SHA: 258897cf064194c95c1de629ca83461617e22ed2
release gate: Validate game #1528 / 32376912504 — SUCCESS
unit: 235/235 PASS
browser: 7/7 PASS
```

Tag `v7.0.0` se nesmí retagovat ani přesouvat. Post-release změny patří na `main` přes samostatné topic PR a do další verze.

## 5. Post-release stav a povolený scope

- PR #248 odstranil nepoužívaný generický Node.js Package workflow, který byl pro statickou browser hru irelevantní.
- #226: dokončit pouze governance/ruční vizuální audit a poté issue uzavřít.
- #229: gameplay polish — post-release scope.
- #230: low-cost visual polish — post-release scope.
- #231: medium visual effects — post-release scope.
- #202: orphan asset cleanup — post-release scope.
- Každá další změna musí být v topic branch + PR; žádné přímé produktové commity do `main`.

## 6. Release historie — neměnit

| Release | Target / stav |
|---|---|
| `v6.0.0` | `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9` |
| `v6.1.0` | `745109103722646b69ad5b514d66f9882662ecb9` |
| `v6.2.0` | `0175ff8483b24de73e835d005cb60d1338c0a491` |
| `v6.3.0` | `f16d5e2aaf7c47752de4c6e6f903924d485837c3` |
| `v7.0.0` | **`258897cf064194c95c1de629ca83461617e22ed2` — PUBLISHED** |

## 7. Povinné reportování

Před změnou: issue/úkol, base SHA, větev, scope, závislosti a konflikty.

Po změně: PR, base/head SHA, změněné soubory, kontrakty, testy, mobilní důkaz, známé problémy a další krok.

Označení **hotovo** je povoleno pouze pro konkrétní ověřitelný výstup. Automatická evidence nesmí být vydávána za ruční vizuální kontrolu a ruční kontrola nesmí být tvrzena bez explicitního lidského potvrzení.
