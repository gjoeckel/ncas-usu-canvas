# NCAS USU Canvas Enhancement System

## Overview

The NCAS (NCADEMI Canvas) enhancement system provides a customized user experience for the USU Canvas course, including enhanced navigation, quiz status tracking, and user authentication flows. This system consists of custom CSS and JavaScript files that are injected into the Canvas LMS theme.

## Purpose

This enhancement system:
- Provides a streamlined navigation experience with a custom navigation bar
- Implements intelligent user authentication detection and redirect flows
- Displays quiz status icons for logged-in Canvas users
- Shows contextual banners and messages based on user authentication status
- Ensures all page elements are fully loaded before revealing content
- Maintains WCAG accessibility compliance

## Features

### Navigation System
- **Custom Navigation Bar**: Pill-style navigation with active state indicators
- **Pages Supported**:
  - Start Here (landing page for all users)
  - Core Skills (main course content)
  - Progress (grades page, visible only to logged-in users)
  - Feedback (course feedback page)
- **Accessibility**: Full keyboard navigation, ARIA labels, skip links

### User Authentication Flow
- **Public Users (Not Logged In)**:
  - Automatically redirected to "Start Here" page on course load
  - See sign-in banner on Core Skills page
  - Can navigate to account creation page
  - Progress link hidden until logged in

- **USU Canvas Users (Logged In)**:
  - Detected on "Start Here" page
  - Automatically redirected to "Core Skills" page
  - Quiz status icons displayed on Core Skills links
  - Status key banner shows legend for quiz status icons
  - Progress link visible in navigation

### Quiz Status System
- **Status Icons**: Visual indicators (Pending, Active, Done) on Core Skills quiz links
- **Status Key Banner**: Legend explaining status icons (dismissible)
- **Real-time Updates**: Status icons update based on quiz completion status
- **Progress Page Integration**: Fetches quiz statuses from Canvas grades page

### Loading Overlay System
- **Initial Load**: Shows "Loading the course..." overlay
- **User Detection**: Cross-fades to "USU Canvas user detected..." for logged-in users
- **Validation**: Overlay persists until all page elements are programmatically validated as loaded
- **Subsequent Navigations**: Overlay shown for Core Skills page navigations

## File Structure

```
ncas-usu-canvas/
├── README.md              # This file
├── user-stories.md        # Detailed user interaction stories
├── ncas23.css            # Custom CSS styles
└── ncas23.js             # Custom JavaScript functionality
```

## Installation & Deployment

### Prerequisites

1. **Canvas LMS Administrator Access**: You must have administrative access to your Canvas LMS instance
2. **Custom Branding Enabled**: Contact your Canvas Customer Success Manager to enable custom branding for your account or sub-account
3. **Theme Editor Access**: Ensure you have access to the Theme Editor in Canvas

### Step-by-Step Installation

#### 1. Enable Custom Branding (If Not Already Enabled)

- Contact your Canvas Customer Success Manager
- Request custom branding to be enabled for your account/sub-account
- This feature allows the upload of custom CSS and JavaScript files

#### 2. Access the Theme Editor

1. Log in to your Canvas LMS instance as an administrator
2. In the **Global Navigation**, click on the **Admin** link
3. Select the account you want to customize
4. In the **Account Navigation**, click on **Themes**

#### 3. Create or Edit a Theme

**To Create a New Theme:**
- Click on the **+ Theme** button
- Give your theme a descriptive name (e.g., "NCAS USU Canvas Enhancement")

**To Edit an Existing Theme:**
- Hover over the theme you want to edit
- Click **Open in Theme Editor**

#### 4. Upload CSS and JavaScript Files

1. In the Theme Editor, navigate to the **Upload** tab
2. **Upload CSS File**:
   - Click the **Select** button next to the **CSS File** field
   - Browse and select `ncas23.css`
   - Wait for upload to complete
3. **Upload JavaScript File**:
   - Click the **Select** button next to the **JavaScript File** field
   - Browse and select `ncas23.js`
   - Wait for upload to complete

#### 5. Preview and Apply Changes

1. Click on **Preview Your Changes** to see how the customizations will appear
2. Test the following:
   - Navigation bar appears and functions correctly
   - User authentication flow works (redirects, banners)
   - Quiz status icons display for logged-in users
   - Overlay system functions properly
3. If satisfied, click **Save Theme**
4. Click **Apply Theme** to implement the changes across your course

### Important Considerations

- **Testing**: Always test customizations in a development/staging environment before applying to production
- **Accessibility**: Ensure customizations don't break screen reader compatibility or keyboard navigation
- **Canvas Updates**: Custom CSS/JS may need updates when Canvas releases new versions
- **Browser Compatibility**: Test across different browsers (Chrome, Firefox, Safari, Edge)
- **Mobile Responsiveness**: Verify functionality on mobile devices

## Technical Architecture

### JavaScript Architecture

The system uses a modular approach with the following key components:

- **Navigation System**: Creates and manages custom navigation bar
- **User Authentication Detection**: Detects Canvas user login status
- **Redirect Flow Management**: Handles initial course load redirects
- **Quiz Status Service**: Fetches and manages quiz completion statuses
- **Overlay Management**: Creates and manages loading overlays
- **Banner System**: Injects and manages contextual banners
- **Page Validation**: Validates all page elements are loaded before revealing content

### CSS Architecture

The CSS follows a component-based structure:

- **Navigation Styles**: Pill-style navigation with active/hover states
- **Page-Specific Styles**: Styles for Core Skills, Start Here, Feedback pages
- **Banner Styles**: Sign-in banner and status key banner styling
- **Overlay Styles**: Loading overlay with fade transitions
- **Accessibility Styles**: Screen reader compatible hiding, focus indicators
- **Responsive Styles**: Mobile and desktop breakpoints

### Key Functions

**Core Functions:**
- `onCourseLoad()`: Determines user Canvas status and handles initial redirects
- `loadUsuCanvasUserCoreSkills()`: Initial setup for logged-in Canvas users
- `updateUsuCanvasCoreSkills()`: Updates quiz status icons for subsequent navigations
- `validateCoreSkillsPageLoaded()`: Validates all page elements are loaded
- `injectSignInBanner()`: Injects sign-in banner for non-logged-in users
- `injectStatusKeyBanner()`: Injects status key banner for logged-in users

**Utility Functions:**
- `waitForPageBodyLoaded()`: Waits for page content to be ready
- `createOrGetOverlay()`: Creates or retrieves loading overlay
- `crossFadeOverlayMessage()`: Smoothly transitions overlay messages
- `extractAssignmentIdsFromLinks()`: Extracts quiz assignment IDs from links
- `applyStatusToCoreSkillsLinks()`: Applies status icons to links

## Browser Compatibility

- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Internet Explorer**: Not supported

## Accessibility

This system is designed with accessibility in mind:

- **WCAG 2.1 AA Compliance**: Meets minimum accessibility standards
- **Screen Reader Support**: ARIA labels, semantic HTML, proper heading structure
- **Keyboard Navigation**: Full keyboard accessibility, skip links
- **Focus Indicators**: Visible focus states for all interactive elements
- **Color Contrast**: Meets WCAG contrast requirements

## Troubleshooting

### Navigation Bar Not Appearing
- Check that both CSS and JS files are uploaded correctly
- Verify theme is applied to the correct account/sub-account
- Check browser console for JavaScript errors

### Quiz Status Icons Not Showing
- Verify user is logged in to Canvas
- Check browser console for API errors
- Ensure Progress page is accessible

### Overlay Not Fading Out
- Check browser console for validation errors
- Verify all page elements are loading correctly
- Check network tab for failed resource loads

### Redirects Not Working
- Verify "Start Here" page exists in Canvas
- Check that course home page is set correctly
- Verify JavaScript is not blocked by browser extensions

## Canvas Health Dashboard

To ensure Canvas hasn’t moved any DOM dependencies, run the **Canvas Health Check** workflow:

1. **Store the token** – Add `CANVAS_API_TOKEN` under **Settings → Secrets and variables → Actions** with a Canvas admin token.
2. **Trigger the workflow** – In GitHub, go to **Actions → Canvas Health Check → Run workflow**.
3. **View results** – The GitHub Pages dashboard at `docs/health-dashboard/index.html` loads `docs/health-results/latest.json` to display the latest pass/fail report.

Each run fetches the critical Canvas pages (Core Skills, Start Here, all skill pages, etc.) and verifies that required selectors still exist. If any dependency breaks, the workflow fails so we can react before production users are impacted.

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify all files are uploaded correctly
3. Test in incognito/private browsing mode to rule out extension conflicts
4. Contact Canvas support if theme editor issues persist

## Version History

- **v21**: Enhanced overlay validation, improved user authentication flow, quiz status system
- Previous versions archived in project repository

## License

This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

---

**Last Updated**: November 12, 2025

