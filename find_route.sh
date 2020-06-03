#!/bin/bash

curl "http://localhost:$1/?to=$2&at=$3" | jq
