# Doulos Attendance System

A premium, secure attendance management system for Doulos meetings at Daystar University.

## Structure
- `client/`: React + Vite + Vanilla CSS (Glassmorphism design)
- `server/`: Node.js + Express + MongoDB

## Getting Started

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access client at `http://localhost:5173` and server at `http://localhost:5000`.

## Features
- **Admin**: Create meetings (with strict time validation), View QR, Export CSV.
- **Student**: Mobile-optimized QR scanning and check-in.
- **Security**: Role-based access, Server-side time enforcement.
