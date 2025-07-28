#!/bin/bash

cd frontend
npm install
cd ..

docker-compose up --build

docker-compose down
