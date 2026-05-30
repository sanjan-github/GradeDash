# Security Policy

## Supported branch

Security fixes are intended for the current `main` branch only.

## Reporting a vulnerability

If you discover a security issue in GradeDash:

1. Do not open a public issue with exploit details.
2. Share a private report with the repository owner or maintainer.
3. Include a short description, reproduction steps, impact, and any suggested fix if you have one.

The goal is to acknowledge credible reports quickly, verify the issue, and ship a fix before public disclosure whenever possible.

## Scope notes

- The web dashboard stores data in the browser with `localStorage`.
- The Python CLI stores data in `students.txt`.
- User-provided content is local to the machine unless the operator exports or shares it manually.
