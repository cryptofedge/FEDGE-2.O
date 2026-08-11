# TASKS.md — FEDGE 2.O Operational To-Do List

## 🚀 High Priority (Pre-Launch / Build Fixes)
- [ ] **Fix Android Gradle Build**: Currently failing at "Run gradlew" stage on Expo EAS.
  - [x] Investigate dependency conflicts in `node_modules`. (Checked versions, fixed build.gradle versions)
  - [ ] Verify `local.properties` or environment variables for `ANDROID_HOME` on build machines.
  - [x] Resolve Kotlin/Gradle deprecation warnings in `expo-modules-core`. (Added jvmTarget 18 and updated plugins)
- [x] **GoFundMe Campaign**: Create the official donation page for youth outreach.
  - [x] Pitch: Use the "Syndicate Pitch" drafted by FEDGE 2.O.
  - [x] Mission: Expand word about FEDGE 2.O and fund outreach in hidden areas.
  - [x] Status: Live (https://www.gofundme.com/f/help-fellito-expand-fedge-2o)

## 🛠️ Ecosystem Integration
- [x] **Update GoFundMe URL**: Once the page is live, update the buttons in:
  - [x] `apps/mobile/app/(tabs)/index.tsx`
  - [x] `docs/index.html`
- [ ] **Data Safety Info**: Draft answers for Google Play Console regarding data collection (XP, Coins, etc.).

## 🎨 Branding & Assets
- [ ] **Finalize Image Assets**: Ensure all logos and character portraits are high-res and correctly referenced in all builds.

## 📅 Roadmap Tracking
- [ ] Dreaming - automated memory refinement (proposed).
- [ ] Outcomes - persistent session memory.
- [ ] Full multiagent orchestration.
