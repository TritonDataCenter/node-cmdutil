#!/bin/bash

#
# Tests that programs using exitOnEpipe() do the expected thing on EPIPE.
#

set -o pipefail
source "$(dirname ${BASH_SOURCE[0]})/common.sh"

#
# First, make sure that our test itself does the right thing.
#
node "$exdir/exitOnEpipe.js" "dontignore" | head
[[ $? -ne 0 ]] || fail "expected non-zero status when EPIPE is not handled"

#
# Now make sure our code actually does the right thing.
#
node "$exdir/exitOnEpipe.js" | head
[[ $? -eq 0 ]] || fail "expected zero status when EPIPE is handled"
