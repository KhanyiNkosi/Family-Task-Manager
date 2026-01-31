// emergency-fix.js - Create fresh package.json
const fs = require('fs');

const freshPackage = {
  "name": "familytask-next",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "dev:env": "powershell -File load-env.ps1 && next dev",
    "build:env": "powershell -File load-env.ps1 && next build",
    "start:env": "powershell -File load-env.ps1 && next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20",
    "@types/react": "^18", 
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.0.0",
    "typescript": "^5"
  }
};

fs.writeFileSync('package.json', JSON.stringify(freshPackage, null, 2), 'utf8');
console.log('✅ Created fresh package.json');
