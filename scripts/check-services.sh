#!/bin/bash

echo "🔍 Checking Smart City Dashboard services..."
echo

# Service definitions
declare -A services=(
    [8080]="📊 Dashboard"
    [8081]="🌤️  Weather"
    [8082]="🚦 Traffic"
    [8083]="🚌 Transit"
    [8084]="⚡ Energy"
    [8085]="📅 Events"
    [8086]="🔔 Notifications"
)

running=0
total=0

for port in "${!services[@]}"; do
    total=$((total + 1))
    name="${services[$port]}"
    
    # Check if service responds
    if curl -s -f "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ $name (port $port) - Running"
        running=$((running + 1))
    else
        echo "❌ $name (port $port) - Not responding"
    fi
done

echo
echo "📊 Summary: $running/$total services running"

if [ $running -eq $total ]; then
    echo "🎉 All services are healthy!"
    echo
    echo "🌐 Access URLs:"
    for port in $(echo "${!services[@]}" | tr ' ' '\n' | sort -n); do
        name="${services[$port]}"
        echo "   $name: http://localhost:$port"
    done
    exit 0
else
    echo "⚠️  Some services are not running. Check logs/ directory for details."
    exit 1
fi