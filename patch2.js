const fs = require('fs');
const file = 'src/utils/translations.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /languages:\s*\{\s*name:\s*'([^']+)',\s*description:\s*'([^']+)'\s*\},\s*\r?\n/g,
  "languages: { name: '$1', description: '$2' },\n      location: { name: 'LOCATION', description: 'Live location tracking' },\n      medical: { name: 'MEDICAL', description: 'Medical details' },\n"
);

fs.writeFileSync(file, content);
console.log('Patched translations.ts');
