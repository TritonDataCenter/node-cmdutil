#
# Common definitions for several tests.  These will only work for programs
# living in the same directory as this file.
#

# Name of this program (for reporting messages)
arg0="$(basename ${BASH_SOURCE[0]})"
# Temporary file used for output
tmpfile="${TMP:-/var/tmp}/$arg0.$$"

# Directory of this test program, used to find the examples we'll test.
testdir="$(dirname ${BASH_SOURCE[0]})"
# Directory of examples, which is relative to this program's directory.
exdir="$testdir/../examples"

function fail
{
	echo "$arg0: $@"
	exit 1
}
