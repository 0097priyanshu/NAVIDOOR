const fs = require('fs');
const file = 'src/utils/translations.ts';
let content = fs.readFileSync(file, 'utf8');

// The regex will match the 'languages: {...},' line and append 'location' and 'medical' after it.
content = content.replace(
  /languages:\s*\{\s*name:\s*'([^']+)',\s*description:\s*'([^']+)'\s*\},\n/g,
  "languages: { name: '$1', description: '$2' },\n      location: { name: 'LOCATION', description: 'Live location' },\n      medical: { name: 'MEDICAL', description: 'Medical info' },\n"
);

fs.writeFileSync(file, content);
console.log('Patched translations.ts');
