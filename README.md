# Default branch renamed from 'master' to 'main'

We've renamed the default branch from 'master' to 'main'.

This is less evocative of a problematic history of human slavery and
oppression, and also more semantically correct.  The only reason it was
'master' in the first place is my own laziness and acceptance of defaults
without too much scrutiny.

To remain lazy, and also take advantage of this improved default branch
name in all new repositories you create, upgrade to the latest version of git,
and add the following to `~/.gitconfig`:

```ini
[init]
	defaultBranch = main
```
