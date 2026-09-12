# Issue tracker: GitHub

Issues and specs for this repository live in the GitHub Issues of
`hobbytp/blender_demos`. Use the `gh` CLI for all operations.

## Conventions

- Create issues with `gh issue create`.
- Read issues and comments with `gh issue view <number> --comments`.
- List and filter work with `gh issue list`.
- Comment with `gh issue comment`.
- Apply states through GitHub labels.
- Close completed work with `gh issue close`.
- Infer the repository from the local Git remote.

## Pull requests as a triage surface

PRs as a request surface: no.

## Skill operations

When a skill says “publish to the issue tracker”, create a GitHub issue.
When a skill says “fetch the relevant ticket”, read the referenced GitHub issue.

For multi-ticket work, use GitHub sub-issues and native issue dependencies when
available. Otherwise, record fallback relationships in issue bodies using
`Part of #<map>` and `Blocked by: #<number>`.
