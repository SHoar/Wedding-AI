#!/bin/sh
set -e
# Substitute only VITE_API_PROXY_TARGET so nginx $host, $remote_addr, etc. are preserved
export VITE_API_PROXY_TARGET="${VITE_API_PROXY_TARGET:-http://backend:3000}"
envsubst '$VITE_API_PROXY_TARGET' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
