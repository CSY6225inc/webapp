#!/bin/bash
set -e

echo "updatung any packages"
sudo apt-get update -y

echo "setting up curl"
sudo apt-get install -y curl

echo "installing nodejs"
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "nodejs is installed"