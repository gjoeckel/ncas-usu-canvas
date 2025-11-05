# Three Methods to Apply Status Logic to Core Skills Checkmarks

## Status Logic Summary (from grades page)
- **Y** = score (from `.grade` text content, e.g., "3" or "-")
- **X** = points possible (from `.tooltip` text content matching `/ X`, e.g., "/ 3")
- **Pending**: Y === '-' → Gray checkmark (#777777) on white fill with gray border
- **Active**: Y < X → Orange/brown checkmark (#955823) on white fill with orange/brown border
- **Done**: Y === X → White checkmark (#ffffff) on green fill (#38993D) with green border

---

## Method 1: Canvas API Fetch (Recommended)
**Approach**: Fetch assignment data from Canvas API using `ENV.course_id` and match links by assignment ID or name.

### Pros:
- ✅ Most reliable - direct from Canvas data
- ✅ Works even if grades table isn't loaded
- ✅ Can cache data for performance
- ✅ Handles all assignment states accurately

### Cons:
- ⚠️ Requires Canvas API authentication
- ⚠️ May need to handle API rate limits
- ⚠️ Slightly more complex implementation

### Implementation Steps:
1. **Extract assignment IDs from links**:
   - Parse `href` attributes from `.custom-link` elements
   - Match to assignment IDs (via data attributes or href parsing)
   - Example: `href="/courses/2803/assignments/55670"` → assignment ID `55670`

2. **Fetch submission data**:
   ```javascript
   const courseId = getCourseId();
   const studentId = ENV.student_id || ENV.current_user?.id;
   const url = `/api/v1/courses/${courseId}/students/submissions?student_ids[]=${studentId}&assignment_ids[]=${assignmentId1}&assignment_ids[]=${assignmentId2}...`;
   ```

3. **Calculate status for each assignment**:
   ```javascript
   function calculateStatus(score, pointsPossible) {
     if (score === null || score === undefined) return 'pending';
     if (score < pointsPossible) return 'active';
     if (score === pointsPossible) return 'done';
     return 'pending';
   }
   ```

4. **Apply CSS classes to links**:
   - Add `data-status="pending"`, `data-status="active"`, or `data-status="done"` to each `.custom-link`
   - Use CSS attribute selectors to style checkmarks accordingly

---

## Method 2: ENV.submissions Data (Fastest)
**Approach**: Use existing `ENV.submissions` array that Canvas loads on the grades page, extract it and match to Core Skills links.

### Pros:
- ✅ Fastest - no API calls needed
- ✅ Data already available in Canvas environment
- ✅ Uses same data source as grades page

### Cons:
- ⚠️ `ENV.submissions` may not be available on Core Skills page
- ⚠️ Requires navigation to grades page first to populate data
- ⚠️ May need to store data in sessionStorage/localStorage

### Implementation Steps:
1. **Extract ENV.submissions when available**:
   ```javascript
   function getSubmissionsData() {
     if (window.ENV && window.ENV.submissions) {
       return window.ENV.submissions;
     }
     // Try to get from sessionStorage if previously stored
     const stored = sessionStorage.getItem('ncademi_submissions');
     return stored ? JSON.parse(stored) : null;
   }
   ```

2. **Match links to assignments**:
   - Extract assignment IDs from link `href` attributes
   - Match to `ENV.submissions` array by `assignment_id`
   - If link href contains assignment ID: `/assignments/55670` → match to submission with `assignment_id: 55670`

3. **Calculate status from submission data**:
   ```javascript
   function getStatusFromSubmission(submission) {
     if (!submission || !submission.score) return 'pending';
     const score = submission.score;
     const pointsPossible = submission.points_possible || 0;
     if (score < pointsPossible) return 'active';
     if (score === pointsPossible && pointsPossible > 0) return 'done';
     return 'pending';
   }
   ```

4. **Store and apply**:
   - Store `ENV.submissions` in sessionStorage when on grades page
   - On Core Skills page, retrieve and apply status classes

---

## Method 3: Cross-Page Data Scraping (Hybrid)
**Approach**: Navigate to grades page (hidden/in background), extract status data from the grades table, then apply to Core Skills links.

### Pros:
- ✅ Uses exact same logic as grades page
- ✅ No API calls or authentication needed
- ✅ Guaranteed to match grades page status

### Cons:
- ⚠️ Requires hidden iframe or background fetch
- ⚠️ More complex implementation
- ⚠️ May have timing/caching issues

### Implementation Steps:
1. **Create hidden iframe or fetch grades page**:
   ```javascript
   function fetchGradesPageData(courseId) {
     const iframe = document.createElement('iframe');
     iframe.style.display = 'none';
     iframe.src = `/courses/${courseId}/grades`;
     document.body.appendChild(iframe);
     
     iframe.onload = () => {
       const gradesTable = iframe.contentDocument.querySelector('table#grades_summary');
       // Extract status data from table
       extractStatusData(gradesTable);
     };
   }
   ```

2. **Extract status from grades table**:
   - Use same `populateStatusColumn()` logic
   - Extract assignment IDs from row IDs: `id="submission_55670"` → assignment ID `55670`
   - Extract status text from `.status` cells: "Pending", "Active", or "Done"

3. **Match to Core Skills links**:
   - Map assignment IDs to link elements
   - Apply status classes based on extracted data

4. **Cache results**:
   - Store status data in sessionStorage
   - Reuse cached data until page refresh

---

## Recommended Approach: Method 1 (Canvas API) with Method 2 Fallback

### Combined Implementation Strategy:
1. **Try Method 2 first** (ENV.submissions - fastest):
   - Check if `ENV.submissions` exists and is populated
   - If available, use it immediately

2. **Fallback to Method 1** (API fetch):
   - If `ENV.submissions` not available, fetch from Canvas API
   - Cache results in sessionStorage for future use

3. **Apply status classes**:
   - Add `data-status` attribute to each `.custom-link`
   - Use CSS to style checkmarks based on `data-status` value

### CSS Implementation:
```css
/* Default: Done style (current) */
body.ncademi-core-skills-page .custom-link.small::after,
body.ncademi-core-skills-page .custom-link.large::after {
  /* Done style - green fill, white checkmark */
}

/* Pending style */
body.ncademi-core-skills-page .custom-link[data-status="pending"]::after {
  background-color: #ffffff;
  color: #777777;
  border: 2px solid #777777;
}

/* Active style */
body.ncademi-core-skills-page .custom-link[data-status="active"]::after {
  background-color: #ffffff;
  color: #955823;
  border: 2px solid #955823;
}

/* Done style */
body.ncademi-core-skills-page .custom-link[data-status="done"]::after {
  background-color: #38993D;
  color: #ffffff;
  border: 2px solid #38993D;
}
```

---

## Next Steps:
1. Choose preferred method (or hybrid approach)
2. Implement JavaScript function to calculate and apply status
3. Update CSS to support dynamic status classes
4. Test on Core Skills page with various assignment states

