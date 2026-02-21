const https = require('https');

https.get('https://nominatim.openstreetmap.org/search?format=json&q=Arnaldo+victaliano+881+ribeirao+preto&limit=5&addressdetails=1', {
    headers: {
        'User-Agent': 'test-app',
        'Accept-Language': 'pt-BR'
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});
