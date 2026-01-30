const https = require('https');
const http = require('http');

const validateSession = (cookie) => {
  return new Promise((resolve, reject) => {
    const url = new URL('https://auth.jdms.nl/api/validate');
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: 'GET',
      headers: {
        'Cookie': cookie
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Auth failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
};

module.exports = async (req, res, next) => {
  // Get session cookie - try multiple common names
  const cookies = req.headers.cookie || '';
  
  if (!cookies) {
    return res.redirect('https://auth.jdms.nl/login?redirect=' + encodeURIComponent('https://invoice.jdms.nl' + req.originalUrl));
  }
  
  try {
    const user = await validateSession(cookies);
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.redirect('https://auth.jdms.nl/login?redirect=' + encodeURIComponent('https://invoice.jdms.nl' + req.originalUrl));
  }
};
