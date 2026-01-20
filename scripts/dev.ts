import { spawn } from 'child_process';

const server = spawn('npm', ['run', 'dev:server'], {
  stdio: 'inherit',
  shell: true,
});

const web = spawn('npm', ['run', 'dev:web'], {
  stdio: 'inherit',
  shell: true,
});

process.on('SIGINT', () => {
  server.kill();
  web.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  web.kill();
  process.exit();
});
