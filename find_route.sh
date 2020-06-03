#!/bin/bash

curl -H "Content-Type: application/json" http://localhost:$1/ --data "{\"path\":[{\"tripName\":\"\",\"stopName\":\"\",\"departsAt\":$3,\"arrivesAt\":$3,\"destination\":\"$2\"}],\"destination\": \"$2\",\"status\":\"incomplete\"}"
