#!/bin/bash
set -e

echo "creating new directory /opt/csye6225"
sudo mkdir -p /opt/csye6225

echo "install unzip"
sudo apt-get update -y && sudo apt-get install -y unzip

echo "deplying artifact"
sudo unzip /tmp/webapp-fork.zip -d /opt/csye6225

echo "install nodejs"
cd /opt/csye6225/ && sudo npm install


echo "set ownerhsip for cyse6225"
sudo chown -R csye6225:csye6225 /opt/csye6225

echo "deploymnet successful"