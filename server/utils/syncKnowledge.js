const https = require('https');
const http = require('http');

const INGEST_WEBHOOK = 'https://n8n-ztpf.onrender.com/webhook/sizzora-ingest';

// Fire-and-forget sync — doesn't block the API response
const syncKnowledge = () => {
    const url = new URL(INGEST_WEBHOOK);
    const lib = url.protocol === 'https:' ? https : http;

    const req = lib.request({
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': 2 },
    });

    req.on('error', (err) => console.error('[Sync] Knowledge base sync failed:', err.message));
    req.write('{}');
    req.end();
};

module.exports = syncKnowledge;
