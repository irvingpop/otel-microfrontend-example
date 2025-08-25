#!/bin/bash

echo "🛑 Stopping all microfrontend services..."

# Kill processes on specific ports
for port in 8080 8081 8082 8083 8084 8085 8086; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Killing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

echo "✅ All services stopped!"