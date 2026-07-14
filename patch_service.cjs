const fs = require('fs');
const file = '/app/applet/src/admin/api/services/apiManagementService.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `const getHeaders = () => {
  const token = localStorage.getItem('user_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  };
};`;

const replacement = `import { auth } from '../../../firebase';

const getHeaders = async () => {
  let token = localStorage.getItem('user_token') || '';
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken() || token;
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  };
};`;

content = content.replace(target, replacement);

// Replace sync getHeaders() with async
content = content.replace(/headers: getHeaders\(\)/g, "headers: await getHeaders()");
content = content.replace(/'Authorization': getHeaders\(\)\['Authorization'\]/g, "'Authorization': (await getHeaders())['Authorization']");

fs.writeFileSync(file, content);
console.log('Patched apiManagementService.ts');
