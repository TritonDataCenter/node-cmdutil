#!/bin/bash

#
# Tests that each of the "fail" examples does exit with the expected status
# code.  The stdout of this program will consist of the stderr from each of
# these examples.  This will be checked by catest.
#

source "$(dirname ${BASH_SOURCE[0]})/common.sh"
# List of examples to test, in order (to ensure output is stable across runs).
tests="$(ls -1 $exdir/fail-* $exdir/usage* | xargs -n1 basename | sort)"

function main
{
	for script in $tests; do
		#
		# We expect tests to fail with status 1, except for the special
		# fail-status.js test, which fails with 7 (to demonstrate
		# precisely this functionality).
		#
		case "$(basename $script)" in
		fail-status.js)		expected=7 ;;
		usage*.js)		expected=2 ;;
		fail*)			expected=1 ;;
		esac

		#
		# We pipe stderr to to stdout (which is *this* script's stdout)
		# so that catest will check that.  We *then* redirect stdout to
		# a temporary file so that we can verify that it's empty.  The
		# order of redirects processed by bash is important.
		#
		echo "testing: $script (expect: $expected)"
		node $exdir/$script 2>&1 > $tmpfile
		rv=$?
		if [[ $rv -ne $expected ]]; then
			rm -f "$tmpfile"
			fail "expected test \"$script\" to fail with" \
			    "status \"$expected\", but found \"$rv\""
		fi
		if [[ -s "$tmpfile" ]]; then
			fail "expected no stdout from \"$script\" " \
			    "(see \"$tmpfile\")"
		fi
		rm -f "$tmpfile"
		echo "-----------------------------------"
		echo
	done
}

main
