#!/bin/sh
# git bisect helper that skips TDD red commits, whose tests fail by design (D-209).
#   git bisect run scripts/bisect.sh pnpm test
case "$(git log -1 --format=%s)" in
  test\(*\):\ red*) exit 125 ;;
esac
exec "$@"
