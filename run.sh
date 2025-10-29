#!/bin/bash

cd frontend
npm install
cd ..

sudo docker-compose up --build

sudo docker-compose down
