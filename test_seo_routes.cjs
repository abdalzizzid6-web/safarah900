
const http = require('http');

const routes = [
    '/robots.txt',
    '/sitemap.xml',
    '/sitemap-matches.xml',
    '/sitemap-news.xml'
];

async function testRoutes() {
    for (const route of routes) {
        try {
            const response = await fetch(`http://localhost:3000${route}`);
            console.log(`${route}: ${response.status}`);
            if (response.status !== 200) {
                const body = await response.text();
                console.log(`Error body: ${body.substring(0, 200)}`);
            }
        } catch (err) {
            console.error(`${route}: Connection failed`, err);
        }
    }
}

testRoutes();
