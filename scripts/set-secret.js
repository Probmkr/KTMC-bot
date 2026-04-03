#!/usr/bin/env node
// 指定したキーの値を Keychain に登録・更新する
// 使い方: node scripts/set-secret.js <KEY>
// 例: node scripts/set-secret.js BOT_TOKEN

const keytar = require('keytar');

const SERVICE = 'ktmc-bot';

function readSecret(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function handler(char) {
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', handler);
        process.stdout.write('\n');
        resolve(value);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    });
  });
}

(async () => {
  const key = process.argv[2];
  if (!key) {
    console.error('使い方: node scripts/set-secret.js <KEY>');
    console.error('例: node scripts/set-secret.js BOT_TOKEN');
    process.exit(1);
  }

  const value = await readSecret(`${key}: `);
  await keytar.setPassword(SERVICE, key, value);
  console.log('  -> 保存しました');
})();
