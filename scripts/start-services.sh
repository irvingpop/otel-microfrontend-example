#!/bin/bash

echo "🏗️  Starting Smart City Dashboard services..."

# Stop any existing services first
./scripts/stop-services.sh

echo "Starting services..."

# Start services in background
npm run dev --workspace=weather-service > logs/weather.log 2>&1 &
sleep 2
npm run dev --workspace=traffic-service > logs/traffic.log 2>&1 &  
sleep 2
npm run dev --workspace=transit-service > logs/transit.log 2>&1 &
sleep 2
npm run dev --workspace=energy-service > logs/energy.log 2>&1 &
sleep 2
npm run dev --workspace=events-service > logs/events.log 2>&1 &
sleep 2
npm run dev --workspace=notifications-service > logs/notifications.log 2>&1 &
sleep 2
npm run dev --workspace=ui-service-shell > logs/shell.log 2>&1 &

echo "Waiting for services to start..."
sleep 8

echo ""
echo "🎉 Services started!"
echo "📊 Dashboard: http://localhost:8080"
echo "🌤️  Weather:   http://localhost:8081"
echo "🚦 Traffic:   http://localhost:8082" 
echo "🚌 Transit:   http://localhost:8083"
echo "⚡ Energy:    http://localhost:8084"
echo "📅 Events:    http://localhost:8085"
echo "🔔 Notifications: http://localhost:8086"
echo ""
echo "Logs are in the logs/ directory"
echo "Run ./scripts/stop-services.sh to stop all services"