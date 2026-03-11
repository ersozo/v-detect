#!/usr/bin/env bash
set -euo pipefail

# V-Safe deployment script for Ubuntu
# Usage: sudo bash deploy/install.sh

APP_DIR="/opt/v-safe"
SERVICE_USER="vsafe"

echo "==> Creating service user..."
id -u "$SERVICE_USER" &>/dev/null || useradd --system --shell /usr/sbin/nologin "$SERVICE_USER"

echo "==> Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip libgl1 libglib2.0-0

echo "==> Setting up application directory..."
mkdir -p "$APP_DIR"
cp -r backend "$APP_DIR/"
cp requirements.txt "$APP_DIR/"

echo "==> Creating Python virtual environment..."
python3 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install --upgrade pip
"$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt"

echo "==> Setting ownership..."
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

echo "==> Installing systemd service..."
cp deploy/v-safe.service /etc/systemd/system/v-safe.service
systemctl daemon-reload
systemctl enable v-safe

echo "==> Done! Start with: sudo systemctl start v-safe"
echo "    View logs with:   journalctl -u v-safe -f"
