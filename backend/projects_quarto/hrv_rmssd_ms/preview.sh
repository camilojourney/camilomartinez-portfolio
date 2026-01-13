#!/bin/bash
# Script to run Quarto with the virtual environment

cd "$(dirname "$0")"
source .venv/bin/activate
quarto preview hrv_research.qmd --no-browser
