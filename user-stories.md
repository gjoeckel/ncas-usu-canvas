# User Stories - NCAS USU Canvas Enhancement System

This document captures all user interactions for the NCAS USU Canvas enhancement system, organized by user type.

---

## A. PUBLIC USER (Not Logged In to USU Canvas)

### Story A1: Initial Course Load

**USER STORY**

As a **student** (not logged in to USU Canvas),
I want to **access the course and be directed to the appropriate starting point**,
So that **I can begin exploring the course content without confusion**.

**WHAT THE USER SEES/EXPERIENCES**

- User navigates to the course URL (e.g., `https://usucourses.instructure.com/courses/2803/`)
- Immediately sees a full-screen overlay with the message "Loading the course..."
- Overlay covers everything including the navigation bar
- After a minimum 1-second display, the overlay message persists
- System checks if user is logged in to Canvas
- If user is NOT logged in:
  - Overlay remains visible while Start Here page loads
  - Once Start Here page body is fully loaded (programmatically validated), overlay fades out
  - Navigation bar appears with "Start Here" link active
  - Start Here page content is revealed
- User never sees the course home page - always redirected to Start Here

**ACCEPTANCE CRITERIA**

- [ ] User is automatically redirected from course home to Start Here page
- [ ] Overlay appears immediately on course load
- [ ] Overlay shows "Loading the course..." message
- [ ] Overlay persists for minimum 1 second
- [ ] Overlay fades out only after Start Here page is fully loaded
- [ ] Navigation bar appears with "Start Here" link active
- [ ] No visual flash or content shift during redirect
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Course home (`/courses/{courseId}/`) → Start Here (`/courses/{courseId}/pages/start-here`)
Elements Affected: Overlay, navigation bar, page body
CSS/JS/Both: Both
Key Functions: `handleInitialRedirects()`, `onCourseLoad()`, `waitForPageBodyLoaded()`, `validateCoreSkillsPageLoaded()`

**ADDITIONAL CONTEXT**

The redirect happens before any page content is visible, ensuring a smooth user experience.

---

### Story A2: Navigation Bar Use

**USER STORY**

As a **student** (not logged in to USU Canvas),
I want to **navigate between course pages using the navigation bar**,
So that **I can easily access different sections of the course**.

**WHAT THE USER SEES/EXPERIENCES**

- Navigation bar appears at the top of the page with pill-style links
- Links available: "Start Here", "Core Skills", "Feedback"
- "Progress" link is hidden (only visible to logged-in users)
- Active page link is highlighted with:
  - White 3px border
  - Rounded corners (8px)
  - Active state styling
- Non-active links show:
  - Transparent 3px border (to prevent layout shift on hover)
  - Hover state: White 3px border, underline
  - Focus state: White 3px border, underline (keyboard navigation)
- Clicking a link navigates to that page
- Active link is removed from keyboard tab order (tabindex="-1")
- Other links are keyboard accessible (tabindex="0")

**ACCEPTANCE CRITERIA**

- [ ] Navigation bar displays with correct links for non-logged-in users
- [ ] "Progress" link is hidden
- [ ] Active link is visually distinct (white border, active styling)
- [ ] Hover states work correctly (white border, underline)
- [ ] Focus states work correctly for keyboard navigation
- [ ] No layout shift when hovering/focusing links
- [ ] Active link is not in tab order
- [ ] Other links are keyboard accessible
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: All course pages
Elements Affected: Navigation bar, navigation links
CSS/JS/Both: Both
Key Functions: `getActiveKey()`, `createLink()`, navigation bar injection

**ADDITIONAL CONTEXT**

Navigation bar is injected via JavaScript and styled with CSS. The pill-style design provides clear visual feedback for the active page.

---

### Story A3: Core Skills Page Use

**USER STORY**

As a **student** (not logged in to USU Canvas),
I want to **view the Core Skills page content and understand how to access quizzes**,
So that **I know what skills are available and how to get started**.

**WHAT THE USER SEES/EXPERIENCES**

- User navigates to Core Skills page (via nav bar or direct URL)
- If navigating directly (not from initial redirect):
  - Overlay appears with "Loading Core Skills page..." message
  - Overlay persists until page is fully loaded
- Page loads with Core Skills content
- Sign-in banner appears at the top of the Core Skills links:
  - Message: "Create a [free USU Canvas account](link) to take quizzes."
  - Dismiss button (×) in upper-right corner
  - Border, rounded corners, centered layout
- Core Skills links are displayed (no status icons)
- Navigation bar shows "Core Skills" link as active
- User can:
  - Read about available skills
  - Click links to view skill pages
  - Dismiss the sign-in banner (dismissed for current session)
  - Click "Create a free USU Canvas account" link to go to account creation page

**ACCEPTANCE CRITERIA**

- [ ] Core Skills page loads correctly
- [ ] Sign-in banner appears for non-logged-in users
- [ ] Sign-in banner has dismiss button in upper-right corner
- [ ] Dismissing banner hides it for current session
- [ ] "Create a free USU Canvas account" link works
- [ ] Core Skills links are displayed without status icons
- [ ] Navigation bar shows "Core Skills" as active
- [ ] Overlay fades out after page is fully loaded
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Core Skills (`/courses/{courseId}/pages/core-skills`)
Elements Affected: Sign-in banner, Core Skills links, overlay
CSS/JS/Both: Both
Key Functions: `injectSignInBanner()`, `applyPageSpecificLogic()`, `validateCoreSkillsPageLoaded()`

**ADDITIONAL CONTEXT**

The sign-in banner is always shown by default for non-logged-in users. It can be dismissed but will reappear in a new session.

---

### Story A4: Feedback Page Use

**USER STORY**

As a **student** (not logged in to USU Canvas),
I want to **access the Feedback page**,
So that **I can provide feedback about the course**.

**WHAT THE USER SEES/EXPERIENCES**

- User clicks "Feedback" link in navigation bar
- Page navigates to Feedback page
- Navigation bar shows "Feedback" link as active
- Feedback page content is displayed
- No special banners or overlays (standard page load)

**ACCEPTANCE CRITERIA**

- [ ] Feedback page loads correctly
- [ ] Navigation bar shows "Feedback" as active
- [ ] Page content is accessible
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Feedback (`/courses/{courseId}/pages/feedback`)
Elements Affected: Navigation bar
CSS/JS/Both: Both
Key Functions: `getActiveKey()`, `applyPageSpecificLogic()`

**ADDITIONAL CONTEXT**

Feedback page is accessible to all users regardless of login status.

---

### Story A5: Creating a Canvas Account Page Use

**USER STORY**

As a **student** (not logged in to USU Canvas),
I want to **access the account creation page**,
So that **I can create a free USU Canvas account to take quizzes**.

**WHAT THE USER SEES/EXPERIENCES**

- User clicks "Create a free USU Canvas account" link from:
  - Sign-in banner on Core Skills page, OR
  - Direct navigation to account creation page
- Page navigates to account creation page (`/courses/{courseId}/pages/create-a-free-usu-canvas-account`)
- Account creation instructions and enrollment link are displayed
- User can follow instructions to create account

**ACCEPTANCE CRITERIA**

- [ ] Account creation page is accessible
- [ ] Enrollment link works correctly
- [ ] Page content is clear and understandable
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Create Account (`/courses/{courseId}/pages/create-a-free-usu-canvas-account`)
Elements Affected: None (standard Canvas page)
CSS/JS/Both: None (standard page)

**ADDITIONAL CONTEXT**

This is a standard Canvas page with enrollment instructions. No special enhancements needed.

---

### Story A6: Using the Create an Account Banner

**USER STORY**

As a **student** (not logged in to USU Canvas),
I want to **interact with the sign-in banner on the Core Skills page**,
So that **I can either create an account or dismiss the banner**.

**WHAT THE USER SEES/EXPERIENCES**

- User is on Core Skills page
- Sign-in banner is visible with message and link
- User can:
  - Click "Create a free USU Canvas account" link:
    - Opens account creation page in new tab
    - Link has proper security attributes (target="_blank", rel="noopener noreferrer")
  - Click dismiss button (×) in upper-right corner:
    - Banner is hidden immediately
    - Banner remains hidden for current session
    - Banner will reappear in new session
- Banner is WCAG compliant:
  - Proper contrast ratios
  - Keyboard accessible
  - Screen reader compatible

**ACCEPTANCE CRITERIA**

- [ ] Sign-in banner is visible on Core Skills page
- [ ] "Create a free USU Canvas account" link opens in new tab
- [ ] Link has proper security attributes
- [ ] Dismiss button is in upper-right corner
- [ ] Clicking dismiss button hides banner
- [ ] Banner stays hidden for current session
- [ ] Banner reappears in new session
- [ ] Banner is keyboard accessible
- [ ] Banner is screen reader compatible
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Core Skills (`/courses/{courseId}/pages/core-skills`)
Elements Affected: Sign-in banner, dismiss button
CSS/JS/Both: Both
Key Functions: `injectSignInBanner()`

**ADDITIONAL CONTEXT**

Banner dismissal is stored in sessionStorage, so it persists during the session but resets on new session.

---

### Story A7: Using Log in to USU Canvas Link

**USER STORY**

As a **student** (not logged in to USU Canvas),
I want to **log in to my existing USU Canvas account**,
So that **I can access quiz functionality and track my progress**.

**WHAT THE USER SEES/EXPERIENCES**

- User clicks "Log in to USU Canvas" link (if present on page)
- User is redirected to Canvas login page
- After successful login, user returns to course
- System detects logged-in status
- User is treated as logged-in user (see Story B1)

**ACCEPTANCE CRITERIA**

- [ ] Login link is accessible (if present)
- [ ] Login link redirects to Canvas login
- [ ] After login, user is redirected back to course
- [ ] System detects logged-in status correctly
- [ ] User sees logged-in experience (quiz status icons, etc.)
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Various (where login link is present)
Elements Affected: Login link, user authentication detection
CSS/JS/Both: Both
Key Functions: `waitForSignedInState()`, `onCourseLoad()`

**ADDITIONAL CONTEXT**

Login detection happens automatically when user returns to course after logging in.

---

## B. USU CANVAS USER (Logged In)

### Story B1: Initial Course Load

**USER STORY**

As a **student** (logged in to USU Canvas),
I want to **access the course and be automatically directed to the Core Skills page**,
So that **I can immediately see my quiz progress and available skills**.

**WHAT THE USER SEES/EXPERIENCES**

- User navigates to the course URL (e.g., `https://usucourses.instructure.com/courses/2803/`)
- Immediately sees a full-screen overlay with the message "Loading the course..."
- Overlay covers everything including the navigation bar
- After a minimum 1-second display, overlay message cross-fades to "USU Canvas user detected. Retrieving your information..."
- System detects user is logged in to Canvas
- User is automatically redirected to Core Skills page
- Overlay remains visible during redirect
- On Core Skills page:
  - System waits for page body to load
  - Sign-in banner is NOT shown (user is logged in)
  - Quiz status icons are fetched and applied to links
  - Status key banner is injected
  - All elements are validated as loaded
  - Overlay fades out to reveal:
    - Navigation bar with "Core Skills" link active
    - Core Skills page content with quiz status icons
    - Status key banner (legend)

**ACCEPTANCE CRITERIA**

- [ ] User is automatically redirected from course home to Start Here, then to Core Skills
- [ ] Overlay appears immediately on course load
- [ ] Overlay shows "Loading the course..." message initially
- [ ] Overlay message cross-fades to "USU Canvas user detected..." for logged-in users
- [ ] Overlay persists during redirect
- [ ] Overlay fades out only after all Core Skills elements are validated as loaded
- [ ] Sign-in banner is NOT shown for logged-in users
- [ ] Quiz status icons are displayed on Core Skills links
- [ ] Status key banner is displayed
- [ ] Navigation bar shows "Core Skills" as active
- [ ] "Progress" link is visible in navigation
- [ ] No visual flash or content shift during redirect
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Course home → Start Here → Core Skills
Elements Affected: Overlay, navigation bar, Core Skills links, status icons, status key banner
CSS/JS/Both: Both
Key Functions: `onCourseLoad()`, `loadUsuCanvasUserCoreSkills()`, `validateCoreSkillsPageLoaded()`, `injectStatusKeyBanner()`

**ADDITIONAL CONTEXT**

The redirect flow ensures logged-in users are immediately taken to Core Skills where they can see their quiz progress. The overlay system ensures smooth transitions without visual glitches.

**Note:** While USU Canvas users start at Core Skills by default, they can navigate to Start Here at any time using the navigation bar, bookmark, or direct URL. When they navigate directly to Start Here (not from course home), they are allowed to stay on that page without being redirected back to Core Skills.

---

### Story B2: Navigation Bar Use

**USER STORY**

As a **student** (logged in to USU Canvas),
I want to **navigate between course pages using the navigation bar**,
So that **I can easily access different sections of the course**.

**WHAT THE USER SEES/EXPERIENCES**

- Navigation bar appears at the top of the page with pill-style links
- Links available: "Start Here", "Core Skills", "Progress", "Feedback"
- "Progress" link is visible (only for logged-in users)
- Active page link is highlighted with:
  - White 3px border
  - Rounded corners (8px)
  - Active state styling
- Non-active links show:
  - Transparent 3px border (to prevent layout shift on hover)
  - Hover state: White 3px border, underline
  - Focus state: White 3px border, underline (keyboard navigation)
- Clicking a link navigates to that page
- Active link is removed from keyboard tab order (tabindex="-1")
- Other links are keyboard accessible (tabindex="0")

**ACCEPTANCE CRITERIA**

- [ ] Navigation bar displays with all links including "Progress"
- [ ] "Progress" link is visible for logged-in users
- [ ] Active link is visually distinct (white border, active styling)
- [ ] Hover states work correctly (white border, underline)
- [ ] Focus states work correctly for keyboard navigation
- [ ] No layout shift when hovering/focusing links
- [ ] Active link is not in tab order
- [ ] Other links are keyboard accessible
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: All course pages
Elements Affected: Navigation bar, navigation links
CSS/JS/Both: Both
Key Functions: `getActiveKey()`, `createLink()`, navigation bar injection

**ADDITIONAL CONTEXT**

The "Progress" link visibility is controlled by JavaScript based on user login status. USU Canvas users can navigate to any page in the navigation bar, including "Start Here", even though they start at Core Skills by default.

---

### Story B3: Core Skills Page Use - Quiz Status Icons

**USER STORY**

As a **student** (logged in to USU Canvas),
I want to **see quiz status icons on Core Skills links**,
So that **I can quickly identify which quizzes I've completed, which are active, and which are pending**.

**WHAT THE USER SEES/EXPERIENCES**

- User navigates to Core Skills page
- If navigating directly (not from initial redirect):
  - Overlay appears with "Loading Core Skills page..." message
  - Overlay persists until page is fully loaded
- Core Skills links are displayed with status icons:
  - **Pending** icon: Quiz not yet available
  - **Active** icon: Quiz available to take
  - **Done** icon: Quiz completed
- Status icons appear next to or integrated with quiz links
- Status icons have proper ARIA labels for accessibility
- Status key banner appears below Core Skills links showing legend
- Navigation bar shows "Core Skills" link as active
- Sign-in banner is NOT shown (user is logged in)

**ACCEPTANCE CRITERIA**

- [ ] Quiz status icons are displayed on Core Skills links
- [ ] Status icons correctly reflect quiz completion status
- [ ] Status icons have proper ARIA labels
- [ ] Status key banner is displayed
- [ ] Status icons update when quiz status changes
- [ ] Sign-in banner is NOT shown
- [ ] Navigation bar shows "Core Skills" as active
- [ ] Overlay fades out after page is fully loaded
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Core Skills (`/courses/{courseId}/pages/core-skills`)
Elements Affected: Core Skills links, status icons, status key banner
CSS/JS/Both: Both
Key Functions: `updateUsuCanvasCoreSkills()`, `applyStatusToCoreSkillsLinks()`, `injectStatusKeyBanner()`, `validateCoreSkillsPageLoaded()`

**ADDITIONAL CONTEXT**

Status icons are fetched from the Canvas Progress page and cached for performance. Status updates happen automatically when user navigates to Core Skills page.

---

### Story B4: Core Skills Page Use - Quiz Status Key Banner

**USER STORY**

As a **student** (logged in to USU Canvas),
I want to **see a legend explaining the quiz status icons**,
So that **I understand what each status icon means**.

**WHAT THE USER SEES/EXPERIENCES**

- User is on Core Skills page (logged in)
- Status key banner appears below Core Skills links
- Banner shows:
  - Label: "Quiz status:"
  - Three status items:
    - Pending icon + "Pending" text
    - Active icon + "Active" text
    - Done icon + "Done" text
  - Dismiss button (×) in upper-right corner
- User can:
  - Read the legend to understand status icons
  - Dismiss the banner (dismissed permanently in localStorage)
  - Banner stays dismissed across sessions if dismissed
- Banner is WCAG compliant:
  - Proper contrast ratios
  - Keyboard accessible
  - Screen reader compatible

**ACCEPTANCE CRITERIA**

- [ ] Status key banner appears on Core Skills page for logged-in users
- [ ] Banner shows all three status types (Pending, Active, Done)
- [ ] Banner has dismiss button in upper-right corner
- [ ] Clicking dismiss button hides banner permanently
- [ ] Banner stays dismissed across sessions
- [ ] Banner is keyboard accessible
- [ ] Banner is screen reader compatible
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Core Skills (`/courses/{courseId}/pages/core-skills`)
Elements Affected: Status key banner
CSS/JS/Both: Both
Key Functions: `injectStatusKeyBanner()`

**ADDITIONAL CONTEXT**

Banner dismissal is stored in localStorage, so it persists across sessions. Banner only appears when status icons are enabled (logged-in users).

---

### Story B5: Navigating to a Core Skills Quiz Page

**USER STORY**

As a **student** (logged in to USU Canvas),
I want to **click on a Core Skills quiz link to view the quiz page**,
So that **I can take the quiz or see my results**.

**WHAT THE USER SEES/EXPERIENCES**

- User is on Core Skills page
- User clicks on a quiz link (e.g., "Take the Quiz" button)
- Page navigates to the quiz/assignment page
- Quiz page loads with:
  - Quiz content
  - "Take the Quiz" button (if not completed)
  - Quiz results (if completed)
- Status icon on Core Skills page reflects quiz status:
  - If quiz is completed: "Done" icon
  - If quiz is available: "Active" icon
  - If quiz is not available: "Pending" icon

**ACCEPTANCE CRITERIA**

- [ ] Clicking quiz link navigates to quiz page
- [ ] Quiz page loads correctly
- [ ] Quiz status is correctly reflected on Core Skills page
- [ ] Status icons update when returning to Core Skills page
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Core Skills → Quiz/Assignment page
Elements Affected: Quiz links, status icons
CSS/JS/Both: Both
Key Functions: `updateUsuCanvasCoreSkills()`, `applyStatusToCoreSkillsLinks()`

**ADDITIONAL CONTEXT**

Status icons are updated when user returns to Core Skills page after taking a quiz.

---

### Story B6: Taking a Quiz

**USER STORY**

As a **student** (logged in to USU Canvas),
I want to **take a quiz from a Core Skills page**,
So that **I can demonstrate my understanding of the skill**.

**WHAT THE USER SEES/EXPERIENCES**

- User is on Core Skills page
- User clicks on a quiz link with "Active" status icon
- User is taken to quiz/assignment page
- User clicks "Take the Quiz" button
- Quiz opens in Canvas
- User completes quiz and submits
- User returns to Core Skills page
- Quiz link now shows "Done" status icon
- Status icon updates automatically

**ACCEPTANCE CRITERIA**

- [ ] User can click quiz link to navigate to quiz page
- [ ] "Take the Quiz" button is functional
- [ ] Quiz opens and can be completed
- [ ] After completion, status icon updates to "Done"
- [ ] Status icon update happens automatically
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Core Skills → Quiz/Assignment page
Elements Affected: Quiz links, status icons, "Take the Quiz" button
CSS/JS/Both: Both
Key Functions: `updateUsuCanvasCoreSkills()`, `applyStatusToCoreSkillsLinks()`, `updateSkillPageQuizButtons()`

**ADDITIONAL CONTEXT**

Status updates are fetched from Canvas Progress page. The system caches statuses for performance.

---

### Story B7: Progress Page Use

**USER STORY**

As a **student** (logged in to USU Canvas),
I want to **view my progress page**,
So that **I can see my grades and quiz completion status**.

**WHAT THE USER SEES/EXPERIENCES**

- User clicks "Progress" link in navigation bar
- "Progress" link is only visible to logged-in users
- Page navigates to Canvas grades page
- Navigation bar shows "Progress" link as active
- Grades page displays:
  - All assignments and quizzes
  - Grades/scores
  - Completion status
- User can see detailed information about quiz performance

**ACCEPTANCE CRITERIA**

- [ ] "Progress" link is visible in navigation for logged-in users
- [ ] Clicking "Progress" link navigates to grades page
- [ ] Navigation bar shows "Progress" as active
- [ ] Grades page displays correctly
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Progress (`/courses/{courseId}/grades`)
Elements Affected: Navigation bar, "Progress" link
CSS/JS/Both: Both
Key Functions: `getActiveKey()`, `createLink()`, navigation bar injection

**ADDITIONAL CONTEXT**

The Progress page is the standard Canvas grades page. The system uses this page to fetch quiz statuses for the Core Skills page.

---

### Story B8: Feedback Page Use

**USER STORY**

As a **student** (logged in to USU Canvas),
I want to **access the Feedback page**,
So that **I can provide feedback about the course**.

**WHAT THE USER SEES/EXPERIENCES**

- User clicks "Feedback" link in navigation bar
- Page navigates to Feedback page
- Navigation bar shows "Feedback" link as active
- Feedback page content is displayed
- No special banners or overlays (standard page load)

**ACCEPTANCE CRITERIA**

- [ ] Feedback page loads correctly
- [ ] Navigation bar shows "Feedback" as active
- [ ] Page content is accessible
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader compatible, keyboard navigation)

**TECHNICAL NOTES**

Page/Location: Feedback (`/courses/{courseId}/pages/feedback`)
Elements Affected: Navigation bar
CSS/JS/Both: Both
Key Functions: `getActiveKey()`, `applyPageSpecificLogic()`

**ADDITIONAL CONTEXT**

Feedback page is accessible to all users regardless of login status.

---

## Additional Notes

### Navigation Behavior for USU Canvas Users
- **Default Start**: USU Canvas users are automatically redirected to Core Skills page when accessing the course from the course home URL
- **Direct Navigation**: USU Canvas users can navigate directly to Start Here page (via navigation bar, bookmark, or direct URL) and will be allowed to stay on that page without being redirected
- **Redirect Detection**: The system detects whether a user arrived at Start Here via redirect from course home or through direct navigation, and only redirects flagged users if they came from course home

### Overlay System
- Overlays are used during initial course load and subsequent Core Skills navigations
- Overlays ensure smooth transitions without visual glitches
- Overlays persist until all page elements are programmatically validated as loaded

### Status Icon System
- Status icons are fetched from Canvas Progress page
- Statuses are cached for performance
- Status icons update automatically when user navigates to Core Skills page

### Banner System
- Sign-in banner: Shown to non-logged-in users on Core Skills page
- Status key banner: Shown to logged-in users on Core Skills page
- Both banners are dismissible and WCAG compliant

### Accessibility
- All features are designed with accessibility in mind
- WCAG 2.1 AA compliance
- Screen reader compatible
- Full keyboard navigation support
- Proper ARIA labels and semantic HTML

---

**Last Updated**: November 12, 2025
