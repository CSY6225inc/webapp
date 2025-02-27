#!/bin/bash
set -e

echo "Checking if Git is available on this system..."
if which git > /dev/null; then
  echo "Git detected. Proceeding with removal..."
  sudo apt-get remove -y git || sudo yum remove -y git
  sudo apt-get autoremove -y || sudo yum autoremove -y
fi

# Confirm Git is no longer present
if which git > /dev/null; then
  echo "ERROR: Git is still present. This does not meet AMI requirements."
  exit 1
else
  echo "SUCCESS: Git has been removed as per AMI specifications."
fi
