#!/bin/bash

echo "OpenInspect setup script is running..."

# Create a validation file to confirm the script executed successfully
touch /tmp/test-pr-repo/.openinspect/setup_complete.txt
echo "Setup completed at $(date)" > /tmp/test-pr-repo/.openinspect/setup_complete.txt

echo "Setup complete. Validation file created at .openinspect/setup_complete.txt"
