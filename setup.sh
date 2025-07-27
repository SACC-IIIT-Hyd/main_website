#!/bin/bash

cp .env.example .env

# Generate a random string
random_string=$(openssl rand -hex 16)

# Update the SECRET_KEY variable in the .env file
sed -i "s/SECRET_KEY=.*/SECRET_KEY=\"$random_string\"/" .env