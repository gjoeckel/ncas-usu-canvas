# Canvas HTML Patterns – Core Skills Pages

## Heading Groups and Sections

Use the `heading-group` and `heading-section` pair to keep headings with their related content and to drive the indentation logic baked into `ncas20.css`. Each `heading-group` wraps one logical topic. Inside it, nest one or more `section.heading-section` blocks so the CSS can scope indentation, margins, and status adornments correctly.

### Layout Pattern

```html
<div class="heading-group">
  <section class="heading-section">
    <h2>Section Title</h2>
    <p>Paragraph text…</p>
    <ul class="list-decimal">
      <li>Structured list item…</li>
    </ul>
  </section>

  <section class="heading-section">
    <h3>Subheading Title</h3>
    <p>Support content…</p>
    <figure class="text-center">
      <!-- media, iframe, etc. -->
    </figure>
  </section>
</div>
```

### Sample Implementation

```html
<div class="icon-right">
  <span>
    <img class="icon centered" src="https://usucourses.instructure.com/courses/2803/files/1197435/preview" alt="" />
  </span>
</div>

<div class="page">
  <p class="margin-top-50">Lists are a way to organize information…</p>

  <div class="heading-group">
    <section class="heading-section">
      <h2>Why Accessible Lists Matter</h2>
      <p>Creating accessible lists helps students quickly understand…</p>
    </section>
  </div>

  <div class="heading-group">
    <section class="heading-section">
      <h2>Learning Objectives</h2>
      <ol class="list-decimal">
        <li>Explain how properly formatted lists…</li>
        <li>Identify when to use bulleted vs. numbered lists…</li>
        <li>Apply best practices to create proper lists.</li>
      </ol>
    </section>
  </div>

  <div class="heading-group">
    <h2>Tips for Success</h2>
    <section class="heading-section">
      <h3>Use Built-in List Formatting Tools</h3>
      <p>Avoid manually inserting symbols…</p>
      <p class="text-center">
        <iframe title="Built-in list tools demo" src="https://www.youtube.com/embed/TnW2JpE3rYs" width="401" height="225" loading="lazy" allowfullscreen></iframe>
      </p>
    </section>

    <section class="heading-section">
      <h3>Use Bullets for Lists and Numbers for Steps</h3>
      <p>Use bullet points for unordered items…</p>
      <ul>
        <li>Did you include a clear introduction…?</li>
        <li>Did you check your spelling and grammar?</li>
        <li>Did you follow the assignment instructions?</li>
      </ul>
    </section>

    <section class="heading-section">
      <h3>Keep Each Item Short and Focused</h3>
      <p>Aim to include one main idea per line…</p>
    </section>
  </div>

  <div class="heading-group">
    <section class="heading-section">
      <h2>Lists Applied: Successful Science Labs</h2>
      <p>Ms. Nguyen, a 4th grade science teacher…</p>
      <ul>
        <li>Safety goggles</li>
        <li>Beakers</li>
        <li>Thermometers</li>
      </ul>
    </section>
  </div>

  <div class="heading-group">
    <section class="heading-section">
      <h2>Shareable Resource</h2>
      <p>
        A summary of this lesson can be found on the
        <a href="https://ncademi.org/resources/basics/lists/">Lists resource page</a>.
      </p>
    </section>
  </div>

  <div class="heading-group">
    <section class="heading-section">
      <h2>Check Your Understanding</h2>
      <p>
        <span>
          <a class="quiz-button" href="https://usucourses.instructure.com/courses/2803/assignments/55674">Take the Quiz</a>
          The Lists quiz has four questions.
        </span>
      </p>
    </section>
  </div>
</div>
```

### Notes

- Wrap the entire page body in `<div class="page">` so global spacing, hero placement, and footer logic from `ncas20.css` apply. Inside that wrapper, Canvas content should start with a `<p class="margin-top-50">` (legacy spacing utility) until we introduce a semantic alternative.
- Keep one top-level heading (`<h2>`) per `heading-group`; nest further detail under `section.heading-section` using `<h3>` and below.
- Lists intended for numbering should use `.list-decimal`; unordered lists can stay unclassed unless additional styling is required.
- Inline spacing classes such as `.margin-top-50` remain until replaced by semantic utilities; document any swap-outs here before editing content HTML.
- Media embeds should remain inside a `heading-section` so indentation and responsive rules apply uniformly.

## Embedded Media (YouTube Players)

Wrap YouTube iframes in `div.ytplayer` so the NCAS CSS can control width, centering, and indentation without extra inline styles. Add the `centered` helper when you want the player centered within its container.

### Pattern

```html
<div class="ytplayer centered">
  <iframe
    title="Video title"
    src="https://www.youtube.com/embed/VIDEO_ID"
    width="401"
    height="225"
    loading="lazy"
    allowfullscreen
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
  </iframe>
</div>
```

- `div.ytplayer` adds the same vertical spacing as the legacy `<p class="text-center">` wrapper while keeping videos responsive (`max-width: 100%`, `aspect-ratio: 16/9`).
- Add the `centered` helper when you need the video centered within its container; omit it for left-aligned embeds.
- Leave explicit `width`/`height` attributes (401 × 225) for Canvas’s editor while letting CSS scale the player.
- Place the wrapper inside the appropriate `heading-section` so it inherits spacing/indent rules defined for course content.

