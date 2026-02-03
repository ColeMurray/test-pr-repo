#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "OpenInspect setup script is running..."

# Create a validation file to confirm the script executed successfully
echo "Setup completed at $(date)" > "$SCRIPT_DIR/setup_complete.txt"

echo "Setup complete. Validation file created at .openinspect/setup_complete.txt"
