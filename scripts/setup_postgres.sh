#!/bin/bash
set -e

echo "updatung dependencies"
sudo apt-get update -y

echo "install postgresql-contrib and postgres"
sudo apt-get install -y postgresql postgresql-contrib

echo "starting postgres to runing in background"
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "sleeping for 10 secs"
sleep 10

echo "postgres installation is completed"