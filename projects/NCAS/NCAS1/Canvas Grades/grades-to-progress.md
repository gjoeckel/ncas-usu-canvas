# Grades Page to Progress Page - Analysis & Mapping

## Goal
Create a Canvas user-created page (`pages/progress`) that replicates `courses/2803/grades` with all Canvas UI hidden and custom header added.

## Canvas IDs & Classes Identified

### Main Container Structure
- `#grade-summary-content` - Main wrapper for grades content
- `#print-grades-container` - Header section with title and print button
  - `.ic-Action-header` - Action header container
  - `.ic-Action-header__Primary` - Primary header section
  - `.ic-Action-header__Heading` - Page heading ("Your Progress")
  - `.ic-Action-header__Secondary` - Secondary header section (buttons)
- `#print-grades-button-container` - Print button container
- `#print-grades-button` - Print button
- `#ClearBadgeCountsButton` - Badge counts button container

### Sorting/Filter Controls (DISABLED)
- `#GradeSummarySelectMenuGroup` - Sort menu container
- `#assignment_sort_order_select_menu` - Sort dropdown
- `#apply_select_menus` - Apply button (disabled)

### Navigation Tabs (DISABLED - Show Assignments Only)
- `#navpills` - Tab navigation container
  - `.ui-tabs-nav` - jQuery UI tabs navigation
  - `.ui-state-default` - Default tab state
  - `.ui-tabs-active` - Active tab state
- `#assignments` - Assignments tab panel
  - `.ui-tabs-panel` - Tab panel container
- `#outcomes` - Learning Mastery tab panel (hidden)

### Grades Table
- `#grades_summary` - Main grades table
  - `.editable` - Editable table class
  - `.ic-Table` - Canvas table base class
  - `.ic-Table--hover-row` - Hover row effect
  - `.ic-Table--grades-summary-table` - Grades-specific table class
- `#aria-announcer` - Screen reader announcements

### Table Headers
- `#asset_processors_header` - Asset processors column header
- Column classes:
  - `.status` - Status column
  - `.assignment_score` - Score column

### Assignment Rows
- `tr.student_assignment` - Assignment row container
  - `.assignment_graded` - Graded assignment indicator
  - `.editable` - Editable row indicator
  - `data-muted="false"` - Muted status
  - `data-pending_quiz="false"` - Quiz status
  - `id="submission_{assignment_id}"` - Row ID pattern

### Assignment Row Cells
- `.title` - Assignment name cell (th)
  - `.ncademi-grade-icon` - Grade icon class (60x60 images)
  - `.context` - Context indicator ("Assignments")
- `.due` - Due date cell
- `.submitted` - Submission date cell
- `.status` - Status cell
  - `data-ncademi-status-populated="true"` - Status populated flag
  - Status values: "Done", "Pending", "Active"
  - Status styles:
    - Done: `color: #336600; font-weight: bold`
    - Pending: `color: #666; font-style: italic`
    - Active: `color: #333; font-weight: bold`
- `.assignment_score` - Score cell
  - `.score_holder` - Score container div
    - `.assignment_presenter_for_submission` - Submission presenter (hidden)
    - `.react_pill_container` - React pill container
    - `.tooltip` - Tooltip wrapper
      - `.grade` - Grade display
      - `.tooltip_wrap.right` - Tooltip positioning
      - `.tooltip_text.score_teaser` - Tooltip text
    - Hidden data spans:
      - `.original_points` - Original points value
      - `.original_score` - Original score
      - `.what_if_score` - What-If score (DISABLED)
      - `.student_entered_score` - Student entered score (DISABLED)
      - `.submission_status` - Submission workflow state
      - `.assignment_group_id` - Assignment group ID
      - `.assignment_id` - Assignment ID
      - `.group_weight` - Group weight
      - `.rules` - Assignment rules
- `.asset_processors_cell` - Asset processors cell
  - `data-assignment-id` - Assignment ID
  - `data-submission-id` - Submission ID
  - `data-assignment-name` - Assignment name
- `.details` - Details cell (icons/links)
  - `.toggle_final_grade_info` - Grade info toggle (hidden)
  - `.toggle_score_details_link` - Score details link (hidden)
  - `.toggle_rubric_assessments_link` - Rubric link (hidden)
  - `.toggle_comments_link` - Comments link (hidden)
    - `id="assignment_comment_{assignment_id}"` - Comment link ID
    - `.comment_count` - Comment count display

### Collapsible Rows (Hidden)
- `#final_grade_info_{assignment_id}` - Final grade info row
- `#grade_info_{assignment_id}` - Grade details row
- `#comments_thread_{assignment_id}` - Comments thread row
- `#rubric_{assignment_id}` - Rubric assessments row

### Group Total Row
- `tr.hard_coded.group_total` - Assignment group total row
  - `id="submission_group-{group_id}"` - Group row ID
  - `.student_assignment` - Student assignment class

### Right Sidebar (DISABLED - Can Hide)
- `#right-side-wrapper` - Right sidebar wrapper
- `#right-side` - Right sidebar container
- `#student-grades-right-content` - Student grades sidebar content
- `#student-grades-final` - Final grade display
- `#student-grades-whatif` - What-If scores section (DISABLED)
- `#student-grades-revert` - Revert scores section (DISABLED)
- `#student-grades-show-all` - Show all details button (DISABLED)
- `#assignments-not-weighted` - Assignment weights info
- `#only_consider_graded_assignments_wrapper` - Checkbox wrapper (DISABLED)
- `#whatif-score-description` - What-If description (DISABLED)

## Canvas ENV Data Structure

### Course Context
```javascript
ENV.course_id = "2803"
ENV.current_context = {
  id: "2803",
  name: "NCADEMI Core Accessibility Skills",
  type: "Course",
  url: "/courses/2803"
}
ENV.student_id = "163152"
```

### Submissions Data
```javascript
ENV.submissions = [
  {
    assignment_id: "55670",
    excused: false,
    score: 3.0,  // null if ungraded
    workflow_state: "graded" | "unsubmitted",
    submission_type: "basic_lti_launch" | null,
    assignment_url: "/courses/2803/assignments/55670"
  },
  // ... more submissions
]
```

### Assignment Groups Data
```javascript
ENV.assignment_groups = [
  {
    id: "9639",
    rules: {},
    group_weight: 0.0,
    assignments: [
      {
        id: "55670",
        submission_types: ["external_tool"],
        points_possible: 3.0,
        due_at: null,
        omit_from_final_grade: false,
        muted: true
      },
      // ... more assignments
    ]
  }
]
```

### Assignment-to-Submission Mapping
- Match `submissions[].assignment_id` with `assignment_groups[].assignments[].id`
- Use `submissions[].workflow_state` to determine status:
  - "graded" → Show score, status "Done" or "Active"
  - "unsubmitted" → Show "-", status "Pending"
- Use `submissions[].score` for display (null if ungraded)
- Use `assignment_groups[].assignments[].points_possible` for max points

## Assignment Data from ENV

### Assignment 55670 - Alternative Text
- Assignment ID: 55670
- Points: 3.0 / 3.0
- Status: graded, score: 3.0
- Submission: Nov 3 at 9:40am
- Icon: `/courses/2803/files/1197429/preview`
- Link: `/courses/2803/assignments/55670/submissions/163152`
- Status Display: "Done" (green, bold)

### Assignment 55673 - Color Use
- Assignment ID: 55673
- Points: 0.0 / 4.0
- Status: graded, score: 0.0
- Submission: Oct 31 at 4:53pm
- Icon: `/courses/2803/files/1197432/preview`
- Link: `/courses/2803/assignments/55673/submissions/163152`
- Status Display: "Active" (dark gray, bold)

### Assignment 55679 - Captions (Pending)
- Assignment ID: 55679
- Points: - / 4.0
- Status: unsubmitted
- Submission: (empty)
- Icon: `/courses/2803/files/1197430/preview`
- Link: `/courses/2803/assignments/55679/submissions/163152`
- Status Display: "Pending" (gray, italic)

### Assignment 55672 - Clear Writing (Pending)
- Assignment ID: 55672
- Points: - / 3.0
- Status: unsubmitted
- Icon: `/courses/2803/files/1197431/preview`
- Link: `/courses/2803/assignments/55672/submissions/163152`

### Assignment 55675 - Headings (Pending)
- Assignment ID: 55675
- Points: - / 4.0
- Status: unsubmitted
- Icon: `/courses/2803/files/1197421/preview`
- Link: `/courses/2803/assignments/55675/submissions/163152`

### Assignment 55680 - Links (Pending)
- Assignment ID: 55680
- Points: - / 4.0
- Status: unsubmitted
- Icon: `/courses/2803/files/1197434/preview`
- Link: `/courses/2803/assignments/55680/submissions/163152`

### Assignment 55674 - Lists (Pending)
- Assignment ID: 55674
- Points: - / 4.0
- Status: unsubmitted
- Icon: `/courses/2803/files/1197435/preview`
- Link: `/courses/2803/assignments/55674/submissions/163152`

### Assignment 55669 - Tables (Pending)
- Assignment ID: 55669
- Points: - / 4.0
- Status: unsubmitted
- Icon: `/courses/2803/files/1197436/preview`
- Link: `/courses/2803/assignments/55669/submissions/163152`

### Assignment 55676 - Text Contrast (Pending)
- Assignment ID: 55676
- Points: - / 3.0
- Status: unsubmitted
- Icon: `/courses/2803/files/1197433/preview`
- Link: `/courses/2803/assignments/55676/submissions/163152`

## Canvas API Endpoints (For Dynamic Data)

### Get Student Grades
```
GET /api/v1/courses/{course_id}/students/{student_id}/grades
```

### Get Assignment Submissions
```
GET /api/v1/courses/{course_id}/students/{student_id}/submissions
```
**Note:** This endpoint provides `submitted_at` timestamps that need to be formatted as "Nov 3 at 9:40am" format.

### Get Assignment Groups
```
GET /api/v1/courses/{course_id}/assignment_groups
```

### Get Assignment Details
```
GET /api/v1/courses/{course_id}/assignments/{assignment_id}
```

### Submission Date Format
- Format: "Nov 3 at 9:40am" or "Oct 31 at 4:53pm"
- Parse ISO timestamp from API and format as: `{Month} {Day} at {Hour}:{Minute}{ampm}`
- Example: `2025-11-03T09:40:00Z` → "Nov 3 at 9:40am"

## Implementation Notes

1. **Hide Canvas UI**: Use CSS to hide `#application > header`, `#left-side`, `#right-side`, breadcrumbs, etc.
2. **Custom Header**: Add `<header id="content-header" class="course-content-header">` at top
3. **Disable Interactivity**: 
   - Remove click handlers from score cells
   - Hide/disable sort controls
   - Hide tabs (show assignments only)
   - Hide What-If functionality
4. **Dynamic Data**: Use JavaScript to fetch from Canvas API or extract from ENV object
5. **Assignment Links**: Must be dynamic - use `ENV.course_id` and `assignment_id`
6. **Score Display**: Show score if graded, "-" if unsubmitted
7. **Status Display**: Map `workflow_state` to status text and styling

## CSS Classes to Hide Canvas UI

```css
/* Hide Canvas global UI */
#application > header,
#left-side,
#right-side-wrapper,
.ic-app-nav-toggle-and-crumbs,
#breadcrumbs {
  display: none !important;
}

/* Expand main content */
#not_right_side {
  width: 100% !important;
  margin: 0 !important;
}
```

## Status Mapping Logic

```javascript
function getStatusDisplay(submission) {
  if (submission.workflow_state === 'graded') {
    if (submission.score === submission.points_possible) {
      return { text: 'Done', style: 'color: #336600; font-weight: bold' };
    } else {
      return { text: 'Active', style: 'color: #333; font-weight: bold' };
    }
  } else {
    return { text: 'Pending', style: 'color: #666; font-style: italic' };
  }
}
```

