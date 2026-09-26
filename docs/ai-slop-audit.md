# GradeDash anti-slop audit

The second pass focused on patterns that make a working interface feel interchangeable with other AI-generated dashboards.

## Findings applied

- **Decoration was doing more work than the product.** The previous page used gradient backgrounds, glass blur, a noise/grid overlay, soft floating shadows, and oversized rounded containers. Those effects now resolve to a flat, lightly bordered workspace.
- **The copy sounded like product-marketing filler.** Phrases such as “Performance command center,” “Student performance studio,” “unlock ranking,” and “polished exports” were replaced with direct classroom tasks: enter marks, check totals, find a student, and export the sheet.
- **The hierarchy was too dashboard-like.** Four floating KPI cards, a promotional sidebar panel, a “cohort signal” block, and a leaderboard made a small marks tool read like a generic SaaS analytics product. The same information remains, but labels now describe the roster and the current rule.
- **The system repeated the same rounded treatment everywhere.** Inputs, menus, cards, badges, avatars, tabs, and action buttons now share a small 4px working radius instead of using large pills and nested floating surfaces.
- **The design was visually complete but not specific enough.** The revised hero explains the actual workflow and the sidebar explains the prerequisite that matters: subjects and maximum marks must be set before entering scores.

## Sources

[1]: https://medium.com/@cssamithpitigala/why-ai-generated-ui-looks-good-but-often-feels-generic-020a9b1b8492 "Why AI-Generated UI Looks Good But Often Feels Generic"
[2]: https://docs.bswen.com/blog/2026-03-30-ai-frontend-design-unique/ "How to Make AI-Generated Frontend Designs Look Unique, Not Generic"
[3]: https://dev.to/gdg/why-ai-websites-all-look-the-same-and-how-to-build-something-different-1gan "Why AI Websites All Look the Same and How to Build Something Different"

Across the three sources, the repeated signals were: familiar dashboard/card layouts, generic sans-serif product language, gradient or glass treatment, generous rounded corners, soft shadows, and visual polish without enough product-specific intent. [1] [2] [3]
