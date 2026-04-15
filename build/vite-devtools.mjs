import { spawn } from 'node:child_process';
import process from 'node:process';

const child = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'build', '--mode', 'prod'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    VITE_ENABLE_DEVTOOLS: 'Y'
  },
  stdio: 'inherit'
});

child.on('error', error => {
  console.error(error);
  process.exit(1);
});

child.on('exit', code => {
  process.exit(code ?? 1);
});
