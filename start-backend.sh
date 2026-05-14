#!/bin/bash
set -e
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo "Starting FastAPI server on http://0.0.0.0:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
