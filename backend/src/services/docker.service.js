import { exec } from 'child_process';

export function listContainers() {
  return new Promise((resolve, reject) => {
    exec('docker ps --format "{{.Names}} {{.Status}}"', (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) return reject(new Error(stderr));
      const containers = stdout.trim().split('\n').map(line => {
        const [name, ...statusParts] = line.split(' ');
        return { name, status: statusParts.join(' ') };
      });
      resolve(containers);
    });
  });
}
