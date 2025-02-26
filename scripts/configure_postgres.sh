#!/bin/bash
set -e

echo "PostgreSQL is being configured"

if [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
  echo "Error: Missing required database secrets"
  exit 1
fi

echo "if not exists DB does not exit create database with name - '$DB_NAME'"
sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\";" || true

echo "check'$DB_USER' exists thereadter password..."
sudo -u postgres psql -c "DO \$\$ BEGIN 
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END \$\$;"

echo "Grant previlages to user"
sudo -u postgres psql <<EOF
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO $DB_USER;
EOF

echo "database configuration is completed"
