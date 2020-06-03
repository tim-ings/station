#!/bin/bash

curl -H "Content-Type: application/json" http://localhost:$1/ --data "{\"path\":[],\"destination\": \"$2\",\"status\":\"incomplete\"}"