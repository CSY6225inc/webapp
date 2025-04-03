#!/bin/bash
set -e

echo "Updating package repositories..."
sudo apt-get update -y

echo "Downloading Amazon CloudWatch Agent package..."
wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb

echo "Installing Amazon CloudWatch Agent..."
sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb

echo "Creating CloudWatch Agent configuration directory..."
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc

echo "Copying CloudWatch Agent configuration file..."
sudo cp /home/ubuntu/amazon-cloudwatch-agent.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

echo "Starting CloudWatch Agent with the configuration..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

echo "Enabling CloudWatch Agent to start on boot..."
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent

echo "Cleaning up..."
sudo rm /tmp/amazon-cloudwatch-agent.deb

echo "CloudWatch Agent installation and configuration complete."