# Redirect Methods for Non-Logged-In Users

## Requirement
When a user is **NOT logged in** to Canvas:
1. The course always redirects them to "Start Here" page when the course loads
2. After visiting "Start Here", they are always taken to the "Core Skills" page

## Method 1: SessionStorage-Based Redirect (Recommended)

**Approach:** Use `sessionStorage` to track if the user has visited "Start Here" in the current session. This provides a clean, session-scoped solution.

### Implementation

```javascript
/**
 * Method 1: SessionStorage-Based Redirect
 * Tracks navigation state within the current browser session
 */
function handleNonLoggedInRedirects() {
  const courseId = getCourseId();
  if (!courseId) return;

  const signedIn = isUserSignedInFast();
  if (signedIn) {
    // User is signed in, clear any redirect flags and allow normal navigation
    sessionStorage.removeItem('ncademi-visited-start-here');
    return;
  }

  const currentPath = normalizePathname(window.location.pathname || '');
  const startHerePath = normalizePathname(`/courses/${courseId}/pages/start-here`);
  const coreSkillsPath = normalizePathname(`/courses/${courseId}/pages/core-skills`);
  const courseHomePath = normalizePathname(`/courses/${courseId}`);
  const courseHomePathSlash = normalizePathname(`/courses/${courseId}/`);

  const hasVisitedStartHere = sessionStorage.getItem('ncademi-visited-start-here') === 'true';
  const isOnStartHere = currentPath === startHerePath;
  const isOnCoreSkills = currentPath === coreSkillsPath;
  const isOnCourseHome = currentPath === courseHomePath || currentPath === courseHomePathSlash;

  // Scenario 1: User lands on course home or any page (except Start Here) without visiting Start Here
  if (!hasVisitedStartHere && !isOnStartHere) {
    log(`Redirecting non-logged-in user to Start Here from: ${currentPath}`);
    if (document.body) {
      document.body.style.display = 'none';
    }
    sessionStorage.setItem('ncademi-redirect-from', currentPath);
    window.location.replace(startHerePath);
    return;
  }

  // Scenario 2: User is on Start Here page - mark as visited
  if (isOnStartHere) {
    sessionStorage.setItem('ncademi-visited-start-here', 'true');
    log('User has visited Start Here page');
    return;
  }

  // Scenario 3: User has visited Start Here, now redirect to Core Skills if they try to go elsewhere
  if (hasVisitedStartHere && !isOnCoreSkills && !isOnStartHere) {
    // Allow navigation to specific pages (feedback, account creation, etc.)
    const allowedPaths = [
      /\/pages\/create-a-free-usu-canvas-account/,
      /\/pages\/feedback/,
      /\/assignments/
    ];
    
    const isAllowedPath = allowedPaths.some(pattern => pattern.test(currentPath));
    if (!isAllowedPath) {
      log(`Redirecting non-logged-in user to Core Skills from: ${currentPath}`);
      if (document.body) {
        document.body.style.display = 'none';
      }
      window.location.replace(coreSkillsPath);
      return;
    }
  }
}
```

### Integration Point
Add this function call early in the initialization, before other redirect logic:

```javascript
// In the main initialization block (around line 2390)
handleNonLoggedInRedirects();

// Then continue with existing redirect logic for signed-in users
const courseId = getCourseId();
const currentPath = window.location.pathname;
if (courseId && (currentPath === `/courses/${courseId}` || currentPath === `/courses/${courseId}/`)) {
  // Only redirect to core-skills if user is signed in
  if (isUserSignedInFast()) {
    const redirectUrl = `/courses/${courseId}/pages/core-skills`;
    log(`Redirecting course home to: ${redirectUrl}`);
    // ... existing redirect code
  }
}
```

### Pros
- ✅ Session-scoped (clears when browser closes)
- ✅ Simple state tracking
- ✅ No URL pollution
- ✅ Works well with browser back/forward buttons

### Cons
- ❌ State is lost if user opens a new tab/window
- ❌ Requires JavaScript enabled

---

## Method 2: URL Parameter-Based Redirect

**Approach:** Use URL query parameters to track navigation state. This makes the state visible and shareable.

### Implementation

```javascript
/**
 * Method 2: URL Parameter-Based Redirect
 * Uses URL query parameters to track navigation state
 */
function handleNonLoggedInRedirectsWithParams() {
  const courseId = getCourseId();
  if (!courseId) return;

  const signedIn = isUserSignedInFast();
  if (signedIn) {
    // Clean up URL parameters for signed-in users
    const url = new URL(window.location.href);
    if (url.searchParams.has('ncademi-flow')) {
      url.searchParams.delete('ncademi-flow');
      window.history.replaceState({}, '', url);
    }
    return;
  }

  const currentPath = normalizePathname(window.location.pathname || '');
  const url = new URL(window.location.href);
  const flowState = url.searchParams.get('ncademi-flow');
  
  const startHerePath = normalizePathname(`/courses/${courseId}/pages/start-here`);
  const coreSkillsPath = normalizePathname(`/courses/${courseId}/pages/core-skills`);
  const courseHomePath = normalizePathname(`/courses/${courseId}`);
  const courseHomePathSlash = normalizePathname(`/courses/${courseId}/`);

  const isOnStartHere = currentPath === startHerePath;
  const isOnCoreSkills = currentPath === coreSkillsPath;
  const isOnCourseHome = currentPath === courseHomePath || currentPath === courseHomePathSlash;

  // Scenario 1: First visit - redirect to Start Here
  if (!flowState && !isOnStartHere) {
    log(`Redirecting non-logged-in user to Start Here from: ${currentPath}`);
    if (document.body) {
      document.body.style.display = 'none';
    }
    const redirectUrl = `${startHerePath}?ncademi-flow=start-here`;
    window.location.replace(redirectUrl);
    return;
  }

  // Scenario 2: User is on Start Here - update URL parameter
  if (isOnStartHere && flowState !== 'start-here') {
    url.searchParams.set('ncademi-flow', 'start-here');
    window.history.replaceState({}, '', url);
    log('User is on Start Here page');
    return;
  }

  // Scenario 3: User has visited Start Here, redirect to Core Skills
  if (flowState === 'start-here' && !isOnCoreSkills && !isOnStartHere) {
    // Allow navigation to specific pages
    const allowedPaths = [
      /\/pages\/create-a-free-usu-canvas-account/,
      /\/pages\/feedback/,
      /\/assignments/
    ];
    
    const isAllowedPath = allowedPaths.some(pattern => pattern.test(currentPath));
    if (!isAllowedPath) {
      log(`Redirecting non-logged-in user to Core Skills from: ${currentPath}`);
      if (document.body) {
        document.body.style.display = 'none';
      }
      const redirectUrl = `${coreSkillsPath}?ncademi-flow=core-skills`;
      window.location.replace(redirectUrl);
      return;
    }
  }

  // Scenario 4: User is on Core Skills - update URL parameter
  if (isOnCoreSkills && flowState !== 'core-skills') {
    url.searchParams.set('ncademi-flow', 'core-skills');
    window.history.replaceState({}, '', url);
  }
}
```

### Integration Point
Same as Method 1, but also update navigation links to preserve the flow parameter:

```javascript
// In createLink function or navigation update logic
function createLink(href, text, active) {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  
  // Preserve flow parameter for non-logged-in users
  if (!isUserSignedInFast()) {
    const url = new URL(window.location.href);
    const flowState = url.searchParams.get('ncademi-flow');
    if (flowState) {
      const linkUrl = new URL(href, window.location.origin);
      linkUrl.searchParams.set('ncademi-flow', flowState);
      link.href = linkUrl.pathname + linkUrl.search;
    }
  }
  
  if (active) {
    link.classList.add('active');
    link.style.background = 'rgb(236, 142, 34)';
  }
  return link;
}
```

### Pros
- ✅ State is visible in URL (shareable, bookmarkable)
- ✅ Works across tabs/windows
- ✅ Can be used for analytics tracking
- ✅ Browser back/forward works naturally

### Cons
- ❌ URL pollution (adds query parameters)
- ❌ More complex link management
- ❌ Users might see and modify parameters

---

## Method 3: LocalStorage-Based Persistent Redirect

**Approach:** Use `localStorage` to remember navigation state across browser sessions. This provides a persistent experience.

### Implementation

```javascript
/**
 * Method 3: LocalStorage-Based Persistent Redirect
 * Remembers navigation state across browser sessions
 */
function handleNonLoggedInRedirectsPersistent() {
  const courseId = getCourseId();
  if (!courseId) return;

  const signedIn = isUserSignedInFast();
  if (signedIn) {
    // User is signed in, clear redirect state
    const storageKey = `ncademi-redirect-${courseId}`;
    localStorage.removeItem(storageKey);
    return;
  }

  const currentPath = normalizePathname(window.location.pathname || '');
  const startHerePath = normalizePathname(`/courses/${courseId}/pages/start-here`);
  const coreSkillsPath = normalizePathname(`/courses/${courseId}/pages/core-skills`);
  const courseHomePath = normalizePathname(`/courses/${courseId}`);
  const courseHomePathSlash = normalizePathname(`/courses/${courseId}/`);

  const storageKey = `ncademi-redirect-${courseId}`;
  const storedState = localStorage.getItem(storageKey);
  let redirectState = storedState ? JSON.parse(storedState) : { visitedStartHere: false, lastVisit: null };

  const isOnStartHere = currentPath === startHerePath;
  const isOnCoreSkills = currentPath === coreSkillsPath;
  const isOnCourseHome = currentPath === courseHomePath || currentPath === courseHomePathSlash;

  // Scenario 1: First visit or haven't visited Start Here - redirect to Start Here
  if (!redirectState.visitedStartHere && !isOnStartHere) {
    log(`Redirecting non-logged-in user to Start Here from: ${currentPath}`);
    if (document.body) {
      document.body.style.display = 'none';
    }
    window.location.replace(startHerePath);
    return;
  }

  // Scenario 2: User is on Start Here - mark as visited
  if (isOnStartHere) {
    redirectState.visitedStartHere = true;
    redirectState.lastVisit = Date.now();
    localStorage.setItem(storageKey, JSON.stringify(redirectState));
    log('User has visited Start Here page (persisted)');
    return;
  }

  // Scenario 3: User has visited Start Here, redirect to Core Skills
  if (redirectState.visitedStartHere && !isOnCoreSkills && !isOnStartHere) {
    // Allow navigation to specific pages
    const allowedPaths = [
      /\/pages\/create-a-free-usu-canvas-account/,
      /\/pages\/feedback/,
      /\/assignments/
    ];
    
    const isAllowedPath = allowedPaths.some(pattern => pattern.test(currentPath));
    if (!isAllowedPath) {
      log(`Redirecting non-logged-in user to Core Skills from: ${currentPath}`);
      if (document.body) {
        document.body.style.display = 'none';
      }
      window.location.replace(coreSkillsPath);
      return;
    }
  }

  // Optional: Add expiration (e.g., reset after 30 days)
  if (redirectState.lastVisit) {
    const daysSinceVisit = (Date.now() - redirectState.lastVisit) / (1000 * 60 * 60 * 24);
    if (daysSinceVisit > 30) {
      // Reset state after 30 days
      localStorage.removeItem(storageKey);
      log('Redirect state expired, resetting');
      if (!isOnStartHere) {
        if (document.body) {
          document.body.style.display = 'none';
        }
        window.location.replace(startHerePath);
        return;
      }
    }
  }
}
```

### Integration Point
Same as Method 1, but with optional expiration logic:

```javascript
// In the main initialization block
handleNonLoggedInRedirectsPersistent();

// Optional: Clean up expired states on page load
function cleanupExpiredRedirectStates() {
  const courseId = getCourseId();
  if (!courseId) return;
  
  const storageKey = `ncademi-redirect-${courseId}`;
  const storedState = localStorage.getItem(storageKey);
  if (storedState) {
    const redirectState = JSON.parse(storedState);
    if (redirectState.lastVisit) {
      const daysSinceVisit = (Date.now() - redirectState.lastVisit) / (1000 * 60 * 60 * 24);
      if (daysSinceVisit > 30) {
        localStorage.removeItem(storageKey);
      }
    }
  }
}
```

### Pros
- ✅ Persistent across browser sessions
- ✅ Remembers user's progress even after closing browser
- ✅ Can add expiration logic
- ✅ No URL pollution

### Cons
- ❌ State persists even after user signs in (requires cleanup)
- ❌ May confuse users who return after a long time
- ❌ Requires localStorage (may be disabled in some browsers)

---

## Comparison Table

| Feature | Method 1 (SessionStorage) | Method 2 (URL Params) | Method 3 (LocalStorage) |
|--------|-------------------------|----------------------|------------------------|
| **Persistence** | Session only | URL-based | Persistent |
| **URL Clean** | ✅ Yes | ❌ No | ✅ Yes |
| **Cross-tab** | ❌ No | ✅ Yes | ✅ Yes |
| **Complexity** | Low | Medium | Medium |
| **User Control** | Limited | Can modify URL | Can clear storage |
| **Analytics** | Limited | ✅ Easy | Limited |
| **Recommended** | ✅ **Yes** | For shareable flows | For persistent UX |

## Recommendation

**Use Method 1 (SessionStorage)** for this use case because:
1. It's the simplest to implement and maintain
2. The redirect behavior is session-scoped, which makes sense for non-logged-in users
3. No URL pollution
4. Easy to test and debug
5. Aligns with the requirement that this only applies to non-logged-in users

## Implementation Notes

1. **Sign-in Detection**: All methods check `isUserSignedInFast()` first and skip redirects for signed-in users
2. **Path Normalization**: Use `normalizePathname()` for consistent path comparison
3. **Body Hiding**: Hide body before redirect to prevent flash of content
4. **Allowed Paths**: Consider which pages should be accessible without redirect (e.g., account creation, feedback)
5. **Error Handling**: Add try-catch blocks around localStorage/sessionStorage operations for browsers that disable storage

## Testing Checklist

- [ ] Non-logged-in user visits course home → redirects to Start Here
- [ ] Non-logged-in user visits any page → redirects to Start Here
- [ ] Non-logged-in user on Start Here → can view page, state tracked
- [ ] Non-logged-in user navigates from Start Here → redirects to Core Skills
- [ ] Non-logged-in user on Core Skills → can view page
- [ ] Non-logged-in user tries to navigate away from Core Skills → redirects back
- [ ] Logged-in user → no redirects, normal navigation
- [ ] Browser back/forward buttons work correctly
- [ ] Multiple tabs/windows behave correctly (Method 1 vs 2 vs 3)

