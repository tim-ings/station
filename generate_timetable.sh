#!/bin/bash

SIZE=$1

# runs the required tools to generate a random timetable
# and then create a docker-compose file for it
cd ./tools
make
cd ..
rm -r ./timetables/$SIZE
mkdir ./timetables/$SIZE
cd ./timetables/$SIZE
../../tools/bin/buildrand $SIZE
cd ../..
./tools/gen_compose.sh ./timetables/$SIZE/adjacency docker-compose.$SIZE.yaml ./timetables/$SIZE