#!/bin/bash
# Start script for Cadence Tracker
set -e

cd "$(dirname "$0")"
echo "Starting Cadence Tracker Server on http://127.0.0.1:8000..."
python3 server.py
