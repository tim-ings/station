#!/bin/bash

# written by Chris.                        run    ./buildadjacency.sh   adjacencyfile  tt-*

if [[ "$#" < "4" ]]; then
    echo "Usage: $0 adjacencyfile timetable1 timetable2 [timetable3...]"
    exit 1
fi

# ---------------------------------------

PATH="/bin:/usr/bin"

adjacency="$1" ; shift

function warn() {
    echo "warning: $@" 1>&2;
}

function has_server() {
    grep -q "^$1\$" < nn
}

head -1 -q $* | cut -d, -f1 | sort -u > nn

for tt in $* ; do
        src=`head -1 < $tt | cut -d, -f1`
        ds=""
        for dest in `sed -n '2,$p' < $tt | cut -d, -f5 | sort -u` ; do
                if has_server $dest ; then
                        ds="$ds $dest"
                else
                        warn "trip $src -> $dest, but $dest has no server"
                fi
        done
        if [ "$ds" != "" ] ; then
            echo "$src $ds"
        fi
done | sort > $adjacency

rm -f nn
