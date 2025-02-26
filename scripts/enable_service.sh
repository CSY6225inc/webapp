#!/bin/bash
set -e

echo "setting ownsership for csye6225"
sudo chown -R csye6225:csye6225 /opt/csye6225
sudo chmod -R 755 /opt/csye6225
sudo chown csye6225:csye6225 /opt/csye6225/.env

echo "set up systemd for nodejs"

sudo tee /etc/systemd/system/csye6225.service > /dev/null <<'EOF'
[Unit]
Description=CSYE6225 Node.js Application
After=network.target postgresql.service

[Service]
User=csye6225
Group=csye6225
WorkingDirectory=/opt/csye6225
EnvironmentFile=/opt/csye6225/.env
ExecStart=/usr/bin/node /opt/csye6225/server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

echo "reload systemd using daemon "
sudo systemctl daemon-reload

echo "enable csye6225 service on stratup"
sudo systemctl enable csye6225.service

echo "starting the service"
sudo systemctl start csye6225.service

echo "check for service status"
sudo systemctl status csye6225.service

echo "configuration for systemd has been set"
