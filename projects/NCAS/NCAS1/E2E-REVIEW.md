# End-to-End Process Review

## Scenario 1: User NOT Signed In to Canvas

### Flow:
1. **User visits course home** (`/courses/2803`)
   - ✅ `handleInitialRedirects()` called
   - ✅ Step 1: Redirects to Start Here (always)
   - ✅ Body hidden before redirect

2. **User lands on Start Here page**
   - ✅ Step 2: Checks sign-in state via `waitForSignedInState()`
   - ✅ Returns `false` (not signed in)
   - ✅ Logs: "User is not signed in, staying on Start Here page"
   - ✅ No redirect happens
   - ✅ User stays on Start Here page

### Status: ✅ COMPLETE - No issues found

---

## Scenario 2: User Signed In to Canvas

### Flow:

1. **User visits course home** (`/courses/2803`)
   - ✅ `handleInitialRedirects()` called
   - ✅ Step 1: Redirects to Start Here (always)
   - ✅ Body hidden before redirect

2. **User lands on Start Here page**
   - ✅ Step 2: Checks sign-in state via `waitForSignedInState()`
   - ✅ Returns `true` (signed in)
   - ✅ Creates aria live region
   - ✅ Sets `ncademi-logged-in-redirect` flag
   - ✅ Announces: "Redirecting to the Core Skills page."
   - ✅ Redirects to Core Skills after 500ms delay

3. **User lands on Core Skills page**
   - ✅ Body class `ncademi-core-skills-page` added
   - ✅ `injectSignInBanner()` called
     - ✅ Checks flag `ncademi-logged-in-redirect` → Returns early (no banner)
   - ✅ `injectStatusKeyBanner()` called (if status-enabled class present)
     - ⚠️ **ISSUE**: Does NOT check flag - will call `isUserSignedInFast()` unnecessarily
   - ✅ `scheduleCoreSkillsStatusUpdate()` called
     - ⚠️ **ISSUE**: Calls `runCoreSkillsStatusUpdate()` which calls `ensureSignedInState()` - redundant Canvas check
   - ✅ `updateCoreSkillsCheckmarks()` called (via `runCoreSkillsStatusUpdate()`)
     - ✅ Checks flag `ncademi-logged-in-redirect` → Skips Canvas check
     - ✅ Clears flag after use
     - ✅ Proceeds with status update

### Issues Found:

#### Issue 1: `runCoreSkillsStatusUpdate()` performs redundant Canvas check
**Location:** Line 71
**Problem:** Even though `updateCoreSkillsCheckmarks()` checks the flag, `runCoreSkillsStatusUpdate()` calls `ensureSignedInState()` first, which does a Canvas check.

**Fix Needed:** Check flag in `runCoreSkillsStatusUpdate()` before calling `ensureSignedInState()`.

#### Issue 2: `injectStatusKeyBanner()` doesn't check flag
**Location:** Line 1758
**Problem:** Calls `isUserSignedInFast()` even when flag is set, causing unnecessary check.

**Fix Needed:** Check flag first, then use it if present, otherwise fall back to `isUserSignedInFast()`.

---

## Summary of Required Updates

1. ✅ `handleInitialRedirects()` - Complete
2. ✅ `updateCoreSkillsCheckmarks()` - Complete (checks flag)
3. ✅ `injectSignInBanner()` - Complete (checks flag)
4. ⚠️ `runCoreSkillsStatusUpdate()` - **NEEDS UPDATE** (check flag before `ensureSignedInState()`)
5. ⚠️ `injectStatusKeyBanner()` - **NEEDS UPDATE** (check flag before `isUserSignedInFast()`)

---

## Flag Usage

**Flag Name:** `ncademi-logged-in-redirect`
**Set:** Line 358 (when redirecting from Start Here to Core Skills)
**Checked:** 
- ✅ Line 1902 (`injectSignInBanner`)
- ✅ Line 2008 (`updateCoreSkillsCheckmarks`)
- ⚠️ **MISSING** in `runCoreSkillsStatusUpdate()` (line 71)
- ⚠️ **MISSING** in `injectStatusKeyBanner()` (line 1758)
**Cleared:** Line 2017 (`updateCoreSkillsCheckmarks`)

---

## Recommended Fixes

### Fix 1: Update `runCoreSkillsStatusUpdate()`
Check flag before calling `ensureSignedInState()`:

```javascript
async function runCoreSkillsStatusUpdate(attempt = 0) {
  if (coreSkillsStatusDisabled) {
    // ... existing code ...
  }

  resetCoreSkillsStatusStateForCurrentPath();
  log(`scheduleCoreSkillsStatusUpdate: attempt ${attempt}`);

  // Check if user was redirected from Start Here (flag indicates user is logged in)
  const loggedInRedirect = sessionStorage.getItem('ncademi-logged-in-redirect') === 'true';
  let signedIn;
  
  if (loggedInRedirect) {
    // User was redirected from Start Here, already verified as logged in
    signedIn = true;
    log("runCoreSkillsStatusUpdate: User verified as logged in from Start Here redirect");
  } else {
    signedIn = await ensureSignedInState({ timeout: 3000 });
  }
  
  if (!signedIn) {
    // ... existing code ...
  }
  
  // ... rest of function ...
}
```

### Fix 2: Update `injectStatusKeyBanner()`
Check flag before calling `isUserSignedInFast()`:

```javascript
async function injectStatusKeyBanner() {
  // ... existing checks ...
  
  // Check if user was redirected from Start Here (flag indicates user is logged in)
  const loggedInRedirect = sessionStorage.getItem('ncademi-logged-in-redirect') === 'true';
  let signedIn;
  
  if (loggedInRedirect) {
    signedIn = true;
    log("Status key banner: User verified as logged in from Start Here redirect");
  } else {
    signedIn = isUserSignedInFast();
  }
  
  if (!signedIn) {
    log("Status key banner: User not signed in");
    return;
  }
  
  // ... rest of function ...
}
```

