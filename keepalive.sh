#!/bin/bash
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
    echo "[$(date)] Server down, restarting..." >> /home/z/my-project/dev.log
    pkill -f "next" 2>/dev/null
    sleep 1
    npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    sleep 6
  fi
  sleep 5
done
