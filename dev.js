const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, cwd, label) {
    const child = spawn(command, args, { cwd, shell: true });

    child.stdout.on('data', (data) => {
        console.log(`[${label}] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`[${label}] ERR: ${data.toString().trim()}`);
    });

    return child;
}

console.log('Starting TheEnvoysOS Development Servers...');

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

const server = runCommand('node', ['index.js'], serverDir, 'Server');
const client = runCommand('npm', ['run', 'dev', '--', '--host'], clientDir, 'Client');

process.on('SIGINT', () => {
    server.kill();
    client.kill();
    process.exit();
});
