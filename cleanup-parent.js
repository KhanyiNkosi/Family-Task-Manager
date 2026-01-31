// parent-dashboard-cleanup.js - Run this to safely remove placeholders
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'parent-dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace hardcoded values with empty/default values
const replacements = [
  // Replace "Clean Room" with empty task title
  { pattern: /"Clean Room"/g, replacement: '""' },
  
  // Replace example names
  { pattern: /"John Doe"|"Jane Smith"|"Fake User"/g, replacement: '""' },
  
  // Replace sample notifications
  { pattern: /message: 'You assigned "Clean Room" to Alex',/g, replacement: 'message: "",' },
  
  // Remove addSampleNotification function but keep the structure
  { pattern: /const addSampleNotification = \(\) => \{[\s\S]*?\n\};\s*\n/g, replacement: '' },
  
  // Remove the sample notification button
  { pattern: /<button[^>]*onClick=\{addSampleNotification\}[^>]*>[\s\S]*?<\/button>/g, replacement: '' },
];

let changesMade = 0;
replacements.forEach(({ pattern, replacement }) => {
  if (content.match(pattern)) {
    content = content.replace(pattern, replacement);
    changesMade++;
    console.log(`Applied replacement: ${pattern}`);
  }
});

if (changesMade > 0) {
  fs.writeFileSync(filePath, content);
  console.log(`✅ Made ${changesMade} replacements`);
} else {
  console.log('No placeholders found to replace');
}
