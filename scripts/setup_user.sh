#!/bin/bash
set -e

echo "creating group csye6225"
sudo groupadd -f csye6225

echo "setting non login user csy6225"
sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225 || true

echo "csye6225 user created "