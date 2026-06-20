"""Vercel Serverless entry point — imports the FastAPI app from backend."""

import sys
from pathlib import Path

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from main import app
