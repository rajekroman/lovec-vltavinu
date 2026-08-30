# Soft Launch & Deployment Checklist

## Pre-Launch (Day -1)

### Code & Assets
- [ ] Final QA matrix: **ALL PASS** (see QA_MATRIX.md)
- [ ] Validator: `npm run validate` → 0 errors, 0 warnings
- [ ] Unit tests: `npm run test:unit` → All 307 pass
- [ ] Smoke tests: `npm run test:smoke` → All Playwright tests pass
- [ ] All assets optimized and manifest updated
- [ ] No console warnings in production (check with DevTools)
- [ ] Build size acceptable (< 5MB total assets)

### Performance Baseline
- [ ] FCP measured: < 2.0s (target)
- [ ] LCP measured: < 3.0s (target)
- [ ] CLS measured: < 0.1
- [ ] Mobile FPS baseline: 30fps+
- [ ] Desktop FPS baseline: 60fps
- [ ] Memory baseline: Stable < 50MB after 2min

### Infrastructure
- [ ] GitHub Pages domain configured
- [ ] HTTPS enabled
- [ ] Service Worker ready (sw.js)
- [ ] Cache busting setup (for v7.3 assets)
- [ ] DNS/CDN configured (if applicable)

### Monitoring Setup
- [ ] Google Analytics (or Plausible) account ready
- [ ] Analytics script in index.html (optional but recommended)
- [ ] Sentry error tracking configured (optional)
- [ ] Slack notifications setup for critical alerts (optional)
- [ ] Email alerts configured for outages

### Documentation & Communication
- [ ] Release notes drafted (v7.3 feature list)
- [ ] Changelog updated
- [ ] Hotfix protocol reviewed and understood
- [ ] Communication plan prepared (Twitter, LinkedIn, email)
- [ ] Beta tester list prepared (if applicable)

### Backup & Rollback
- [ ] Current `main` branch backed up
- [ ] Rollback procedure documented
- [ ] Previous v7.2 release still available as fallback

---

## Launch Day (Day 0) — Deployment

### 1. Create GitHub Release (1 hour before)

**Release Title**: `Lovec vltavínů v7.3 — Launch Ready`

**Release Body** (use template below):

```markdown
## Lovec vltavínů v7.3 — Official Release

### What's New
- **Audio Integration**: Full audio system with dig SFX, ambient loops, UI feedback
- **UI Animations**: Smooth scene transitions, score popups, finding pulses
- **i18n Support**: Czech/English language switching with persistent preference
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Performance**: Optimized rendering, reduced animations for motion-sensitive users
- **Mobile**: Full responsive design (portrait/landscape), touch controls

### Download & Play
**Web**: https://rajekroman.github.io/lovec-vltavinu/
**Repository**: https://github.com/rajekroman/lovec-vltavinu

### Technical Details
- Validation: 0 errors, 0 warnings
- Tests: 307 unit tests passing
- Browser Support: Chrome, Safari, Firefox, Edge (latest)
- Mobile Support: iOS 14+, Android 8+
- Offline Support: PWA with service worker caching

### Known Limitations
- Audio requires user gesture (iOS policy)
- Landscape mode not optimized for iPad (works, but compact)
- Slow network: Assets may take >5s to load (shows spinner)

### Bug Reports & Feedback
Report issues: https://github.com/rajekroman/lovec-vltavinu/issues
Discussion: https://github.com/rajekroman/lovec-vltavinu/discussions

**Changelog**: See CHANGELOG.md for detailed version history.

---
_Game by Roman Rajek | Built with Three.js & vanilla JS | v7.3 Release_
```

### 2. Push Release Tag

```bash
git tag -a v7.3.0 -m "Lovec vltavínů v7.3 — Official release"
git push origin v7.3.0
```

### 3. Verify GitHub Pages Deployment

- [ ] Visit: https://rajekroman.github.io/lovec-vltavinu/
- [ ] Page loads without 404s
- [ ] Service worker installs (check DevTools → Application)
- [ ] All assets load correctly
- [ ] No console errors
- [ ] Analytics script loaded (if enabled)

### 4. Smoke Tests (5 minutes)

**On GitHub Pages URL**:
- [ ] Title screen loads
- [ ] Can click "Start Game"
- [ ] Can play Chlum level
- [ ] Audio works after first tap
- [ ] Finding collection works
- [ ] Results screen shows

### 5. Initial Monitoring (First Hour)

**Every 10 minutes**:
- [ ] Check Sentry dashboard for new errors
- [ ] Monitor analytics traffic (should see visitors)
- [ ] Check GitHub Issues (monitor for reports)
- [ ] Spot-check on mobile device

**Metrics to Watch**:
- Error rate: Should be < 0.1%
- Session duration: Expect 15-20 min average
- Bounce rate: Keep eye on it
- Most used browsers/devices

### 6. Communicate Launch

Choose timing and send:
- [ ] Twitter/X announcement with screenshot
  ```
  "🎮 Lovec vltavínů v7.3 is LIVE!
  
  A web-based archaeological game set in 
  Czech Moldavite hunting regions. Play now:
  https://rajekroman.github.io/lovec-vltavinu/
  
  #Games #WebGame #HTML5"
  ```
  
- [ ] LinkedIn post (professional version)
- [ ] GitHub Discussions announcement
- [ ] Email to beta testers: "v7.3 is live, thanks for testing!"
- [ ] Update README.md with "Live" badge if applicable

### 7. 24-Hour Monitoring Report

**Track these metrics** (24 hours post-launch):
- Total sessions: _____
- Unique visitors: _____
- Crash rate: _____ (target: < 1 per 1000)
- Error rate: _____ (target: < 5 per 10000)
- Average session duration: _____ min
- Completion rate: ____% (finished game)
- Top browsers: _____
- Top devices: _____
- Error logs (top 3): _____

---

## Post-Launch Monitoring (Days 1-7)

### Daily Checks (Each Morning)

```
## [Date] — Daily QA Report

**Metrics**:
- Sessions since launch: _____
- New errors (24h): _____
- User feedback: [URLs/summaries]
- Performance: FCP ___ms, LCP ___ms
- Status: 🟢 Nominal / 🟡 Minor issues / 🔴 Critical

**Actions Taken**: [List any hotfixes applied]
**Next Check**: [When/what to monitor]
```

### Monitoring Dashboard Checklist

**Sentry (if enabled)**:
- [ ] Error rate trending down
- [ ] No new error types (should repeat familiar patterns)
- [ ] Session replay works for debugging
- [ ] Alerts trigger appropriately

**Google Analytics**:
- [ ] Geographic distribution: Mostly CZ?
- [ ] Device breakdown: Mobile/desktop ratio
- [ ] Browser breakdown: Expected browser share
- [ ] Funnel analysis: Where do players drop off?
- [ ] Session flow: Most common paths

**GitHub**:
- [ ] New issues: Read and triage each day
- [ ] Discussion posts: Respond to feedback
- [ ] Feature requests: Track for v7.4 roadmap

### Weekly Metrics Review

**Every Sunday**:
```
## Week 1 Summary

**Player Engagement**:
- Total sessions: _____
- Unique players: _____
- Return rate: ____% (played twice+)
- Avg completion time: _____ min
- Levels reached: [Chlum: __%, Nesměň: __%, Besednice: __%, Slavia: __%]

**Performance**:
- Avg load time: _____ s
- Crash rate: _____ per 1000 (target: < 1)
- Performance score: _____ (target: > 80)
- Mobile vs Desktop: __% mobile

**Feedback Summary**:
- Total issues reported: _____
- P0/P1 bugs: _____ (status: [fixed/investigating])
- Feature requests: _____ (themes: _____)
- Sentiment: 🟢 Positive / 🟡 Mixed / 🔴 Negative

**Action Items for Week 2**:
- [ ] Item 1
- [ ] Item 2
```

---

## Hotfix Protocol

**Use when**: P0 bug found (game-breaking, crashes, unplayable)

### 1. Triage (< 1 hour)

- [ ] Reproduce on multiple devices/browsers
- [ ] Document exact steps
- [ ] Assess impact (how many users?)
- [ ] Classify severity: **P0** / P1 / P2 / P3

### 2. Fix (< 2 hours)

- [ ] Create branch: `hotfix/issue-[number]`
- [ ] Identify root cause
- [ ] Implement minimal fix (no features)
- [ ] Run locally: `npm run validate && npm run test:unit && npm run test:smoke`
- [ ] Code review (2-minute peer check)

### 3. Deploy (< 30 min)

```bash
# Create PR
git push -u origin hotfix/issue-123

# Get PR URL from output, then create PR on GitHub
# GitHub Actions will run CI automatically

# Once CI passes, merge to main
git checkout main
git pull origin main
git merge hotfix/issue-123
git push origin main

# GitHub Pages redeploys automatically
# Verify on live site (5 minutes)
```

### 4. Communicate

- [ ] Comment on GitHub Issue: "Fixed in v7.3.1, deploying now"
- [ ] Tweet (if P0): "🔧 Hotfix deployed for [issue name]"
- [ ] Clear browser cache (Ctrl+Shift+Del) and retest
- [ ] Verify on actual device (not just emulation)

### 5. Update Version

Once v7.3.1 hotfix is live:
- [ ] Create GitHub release tag: v7.3.1
- [ ] Update CHANGELOG.md
- [ ] Add to "Known Issues" section if limitation

---

## Known Issues Log

### v7.3.0
- **iOS Audio**: Audio may require 2 taps (Apple's autoplay policy)
- **Slow Networks**: Assets may take >5s to load (shows spinner)
- **iPad Landscape**: Not optimized (playable but compact layout)
- **Safari**: Reduced-motion may disable all animations

### Fixed in v7.3.1
- [If applicable after hotfix]

### Fixed in v7.3.2
- [If applicable after hotfix]

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| v7.3.0 | 2026-09-06 | Live | Initial release |
| v7.3.1 | TBD | TBD | [Hotfix if needed] |
| v7.2.0 | 2026-08-15 | Archived | Previous stable |

---

## Success Metrics (7-Day Target)

**Launch is considered successful when**:
- ✅ Game loads without errors for > 95% of users
- ✅ Average completion rate > 60%
- ✅ No P0 bugs after day 1
- ✅ User feedback sentiment positive (> 70%)
- ✅ Performance metrics within targets
- ✅ No unplanned downtime

**Scaling is successful when**:
- ✅ Can handle 100+ concurrent users
- ✅ Scales to 1000+ daily players
- ✅ CDN/caching reduces load on server
- ✅ Service Worker reduces bandwidth by 60%+

---

## Long-Term Maintenance (Week 2+)

### Maintenance Window
- **Monday**: Performance review + analytics
- **Wednesday**: User feedback triage
- **Friday**: Plan next release cycle

### v7.4 Roadmap (Track feedback)
- [ ] Feature: [User-requested]
- [ ] Fix: [Known limitation]
- [ ] Optimization: [Performance improvement]

### Support Channels
- **GitHub Issues**: Bug reports (fastest response)
- **GitHub Discussions**: Feature requests & feedback
- **Email**: rajek.roman@gmail.com (slower, for urgent matters)
- **Social Media**: Twitter @rajekroman (low priority)

---

## Contingency Plans

### Scenario 1: Critical Bug Found

**Action Plan**:
1. Hotfix (< 2 hours)
2. Deploy to main
3. Verify on live site
4. Communicate via Twitter/Issues
5. Monitor metrics for improvement

### Scenario 2: DDoS/Performance Under Load

**Action Plan**:
1. Enable CloudFlare/DDoS protection (if configured)
2. Check analytics for spike
3. Verify service workers cached correctly
4. Consider pausing social media promotion temporarily
5. Monitor and report on recovery

### Scenario 3: Third-Party Service Outage

**Action Plan**:
1. Verify GitHub Pages is up (check status page)
2. Check analytics service (if used)
3. If analytics down: Continue monitoring locally
4. If GitHub Pages down: Deploy to backup CDN (if available)
5. Communicate to users via Twitter/email

---

**Launch Coordinator**: [Name/Role]  
**QA Lead**: [Name/Role]  
**DevOps Contact**: [Name/Role]  
**Communications**: [Name/Role]  

**Launch Date Scheduled**: 2026-09-06  
**Status**: 🔵 Planned  

---

_Last Updated: 2026-08-30 — Claude Code_
