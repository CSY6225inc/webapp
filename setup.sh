#!/bin/bash
set -e

APP_DIR="/opt/csye6225"
APP_ZIP="/tmp/webapp-fork.zip"
APP_GROUP="webapp_group"
APP_USER="webapp_user"
APP_DEST="$APP_DIR/webapp-fork"
ENV_FILE="$APP_DEST/.env"

# Check for Windows line endings
if grep -q $'\r' "$0"; then
  echo "Error: Convert script to Linux line endings (LF)"
  exit 1
fi

read -sp "Enter Database Password: " DB_PASSWORD
echo  "password has been input" 

if [ -z "$DB_PASSWORD" ]; then
  echo "Password is empty, retry"
  exit 1
fi

read -sp "Enter Database user: " DB_NAME
echo  "dbname has been input" 

if [ -z "$DB_NAME" ]; then
  echo "dbname is empty, retry"
  exit 1
fi
echo "Updating packages"
sudo apt-get update -y

echo "Upgrading system"
sudo apt-get upgrade -y

echo "Installing dependencies"
sudo apt-get install -y unzip postgresql postgresql-contrib nodejs npm

echo "Verifying installations"
unzip -v
node -v

echo "installing postgres"
sudo apt-get install postgresql postgresql-contrib

echo "Configuring PostgreSQL"
sudo systemctl enable postgresql
sudo systemctl start postgresql

if ! getent group "$APP_GROUP" >/dev/null; then
  echo "Creating group: $APP_GROUP"
  sudo groupadd "$APP_GROUP"
fi

if ! id -u "$APP_USER" >/dev/null; then
  echo "Creating user: $APP_USER"
  sudo useradd -m -g "$APP_GROUP" -s /bin/bash "$APP_USER"
fi

echo "Setting up app directory"
sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER:$APP_GROUP" "$APP_DIR"

echo "Deploying application"
sudo unzip -o "$APP_ZIP" -d "$APP_DIR"
sudo chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"
sudo chmod -R 750 "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Existing .env file not found at $ENV_FILE"
  exit 1
fi

# password update in env
sudo sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD='${DB_PASSWORD}'/" "$ENV_FILE"

# set permissions
sudo chown "$APP_USER:$APP_GROUP" "$ENV_FILE"
sudo chmod 600 "$ENV_FILE"

echo "Updating database password"
sudo -u postgres psql -c "ALTER USER ${DB_NAME} WITH PASSWORD '${DB_PASSWORD}';"

echo "Installing dependencies"
cd "$APP_DEST"
sudo -u "$APP_USER" npm install
sudo -u "$APP_USER" npm install dotenv --save

echo "Starting application"
sudo -u "$APP_USER" npm start

unset DB_PASSWORD

echo "Deployment completed successfully"
