#!/usr/bin/env node
// Keychain に KTMC Bot の環境変数を登録するセットアップスクリプト

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

async function addSecret(key, optional = false) {
  const suffix = optional ? '（スキップする場合は空 Enter）' : '';
  const value = await readSecret(`${key}${suffix}: `);
  if (!value && optional) {
    console.log('  -> スキップしました');
    return;
  }
  await keytar.setPassword(SERVICE, key, value);
  console.log('  -> 保存しました');
}

(async () => {
  console.log('=== KTMC Bot — Keychain セットアップ ===\n');

  await addSecret('BOT_TOKEN');
  await addSecret('APP_ID');
  await addSecret('DATABASE_URL');
  await addSecret('GUILD_ID', true);

  console.log('\nセットアップ完了。');
})();
