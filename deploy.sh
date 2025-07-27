#!/bin/bash

# echo "Please setup the environment variables in the .env file"
docker compose -p sacc -f docker-compose.prod.yml down
docker compose -p sacc -f docker-compose.prod.yml up --build -d

/var/proxy_container.sh -c sacc-nginx-1 -d sacc.iiit.ac.in -p 80