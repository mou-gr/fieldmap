#!/bin/bash

for inv in 1	2	82	90	96	98	99	100	105	106	107	108	109	110	111	112	113	114	115	116	117	122	124	128	129	130	135; do
	printf "invitation $inv: "
	node app.js -i $inv -c 204
done
