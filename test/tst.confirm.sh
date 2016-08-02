#!/bin/bash

#
# Tests the "confirm" function.
#

source "$(dirname ${BASH_SOURCE[0]})/common.sh"

function main
{
	set -o errexit

	echo "test: stdin from /dev/null"
	( confirm < /dev/null ) && fail "expected failure"

	echo "test: confirm 'yes'"
	( echo -n y | confirm ) || fail "expected success"

	echo "test: confirm 'YES'"
	( echo -n Y | confirm ) || fail "expected success"

	echo "test: confirm 'no'"
	( echo -n n | confirm ) && fail "expected failure"

	echo "test: confirm garbage"
	( echo garbage | confirm ) && fail "expected failure"

	return 0
}

function confirm
{
	node $exdir/confirm.js
}

main
