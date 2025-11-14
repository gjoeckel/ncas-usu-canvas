# Changelog

## Instructions

1. Generate timestamp using `./scripts/generate-timestamp.sh` and copy the output
2. Review last entry (reverse chronological)
3. Add new entry to the top of the Entries section that documents all changes

## Entries

### 2025-11-12 19:22:46 UTC - Enhanced Core Skills overlay validation

**Branch:** feedback-updates
**Files Modified:** 1
- projects/NCAS/NCAS1/ncas21.js

**Changes:**
- Created `validateCoreSkillsPageLoaded()` function to programmatically validate all Core Skills page elements before allowing overlay fade-out
  - Validates content-wrapper exists with content
  - Validates Core Skills links are present
  - For Canvas users: Validates status icons are applied and status key banner is visible (if status enabled)
  - For non-Canvas users: Validates sign-in banner is visible
  - Waits for all images to load (with timeout protection)
  - Includes max attempts limit (5 seconds) to prevent infinite waiting
- Updated `loadUsuCanvasUserCoreSkills` flow (initial redirect):
  - Overlay now waits for `validateCoreSkillsPageLoaded()` to complete before fading out
  - Ensures all page elements are validated as loaded before revealing content
- Updated `updateUsuCanvasCoreSkills` flow (subsequent navigations):
  - Creates overlay for subsequent Core Skills navigations (if not already active)
  - Overlay message: "Loading Core Skills page..."
  - Waits for `validateCoreSkillsPageLoaded()` to complete before fading out
  - Works for both Canvas users (flag present) and non-Canvas users (flag not present)

**Impact:**
- Prevents overlay from fading out prematurely before all page elements are loaded
- Improves user experience by ensuring complete page readiness before revealing content
- Handles both initial redirect flow and subsequent navigation scenarios

**Commit:** [pending]

---

### 2025-11-10 19:54:50 UTC - Local Commit: 8 files on feedback-updates

**Branch:** feedback-updates
**Files Modified:** 8
- projects/NCAS/NCAS1/ncas16.css
- projects/NCAS/NCAS1/ncas16.js
- projects/NCAS/NCAS1/ncas18.css
- projects/NCAS/NCAS1/ncas18.js
- projects/NCAS/NCAS1/archive/ncas16.css
- projects/NCAS/NCAS1/archive/ncas16.js
- projects/NCAS/NCAS1/archive/ncas17.css
- projects/NCAS/NCAS1/archive/ncas17.js
**Commit:** [pending]

---


### 2025-11-03 18:55:19 UTC - Merged simplify-extension to main

**Action:** Local branch merge
**Source Branch:** simplify-extension
**Target Branch:** main
**Status:** ✅ Complete
**Merge Commit:** 87b7765

---


