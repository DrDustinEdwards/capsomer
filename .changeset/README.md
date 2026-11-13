# Changesets

Merging and releasing are two steps (Dustin, 2026-11-13). A pull request never sets the version or writes CHANGELOG.md;
it adds a changeset, a short Markdown file here that says what changed and how big the change is:

    npx changeset            # asks patch, minor or major, then the text
    npx changeset --empty    # a change with nothing to release (CI, docs, tests)

Write the text as the CHANGELOG entry it becomes: every removed or renamed token or class and every changed HTML contract
(CLAUDE.md). CI fails a pull request with no changeset.

A release is its own pull request, made when a site needs what has merged:

    git switch -c release main && npx changeset version

That sets package.json's version from the waiting changesets, writes their text into CHANGELOG.md and deletes them.
Merging it is the release: `.github/workflows/release.yml` tags `vX.Y.Z`, publishes the GitHub release and starts the
consumer bumps. Several merged changes go out in one release, so the sites repin once.
