#!/bin/bash

#
# Tests the "warn" example.
#

source "$(dirname ${BASH_SOURCE[0]})/common.sh"

if ! node "$exdir/warn.js" > $tmpfile 2>"$tmpfile.2"; then
	rm -f "$tmpfile" "$tmpfile.2"
	fail "expected warn.js to succeed"
fi

echo "command stdout:"
echo "---------------"
cat "$tmpfile"
echo "---------------"
echo "command stderr:"
echo "---------------"
cat "$tmpfile.2"
echo "---------------"
rm -f "$tmpfile" "$tmpfile.2"
