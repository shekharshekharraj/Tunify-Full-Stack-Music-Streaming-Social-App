#!/usr/bin/env bash
set -e

# 1) Build frontend (outputs frontend/dist)
cd frontend
npm ci
npm run build
cd ..

# 2) Install backend deps (so server can start)
cd backend
npm ci
cd ..
