const https = require('https');
https.get('https://nominatim.openstreetmap.org/reverse?format=json&lat=-21.1914545&lon=-47.7866496&zoom=18&addressdetails=1', {
    headers: { 'User-Agent': 'test', 'Accept-Language': 'pt-BR' }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
