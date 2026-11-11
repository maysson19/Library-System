// Run once from the frontend folder:  node enable-proxy.js
// It tells "ng serve" to use proxy.conf.json and to accept public tunnel addresses.
const fs = require('fs');

const file = 'angular.json';
fs.copyFileSync(file, file + '.bak');
const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));

const projectName = Object.keys(cfg.projects)[0];
const project = cfg.projects[projectName];
const targets = project.architect || project.targets;
const serve = targets.serve;

serve.options = Object.assign({}, serve.options, {
  proxyConfig: 'proxy.conf.json',
  allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io', '.loca.lt'],
});

fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
console.log('angular.json updated for project "' + projectName + '" (backup: angular.json.bak)');
