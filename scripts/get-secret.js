#!/usr/bin/env node
// 指定したキーの値を Keychain から取得して表示する
// 使い方: node scripts/get-secret.js <KEY>
// 例: node scripts/get-secret.js BOT_TOKEN

const keytar = require('keytar');

const SERVICE = 'ktmc-bot';

(async () => {
  const key = process.argv[2];
  if (!key) {
    console.error('使い方: node scripts/get-secret.js <KEY>');
    console.error('例: node scripts/get-secret.js BOT_TOKEN');
    process.exit(1);
  }

  const value = await keytar.getPassword(SERVICE, key);
  if (value === null) {
    console.error(`"${key}" は登録されていません`);
    process.exit(1);
  }

  console.log(value);
})();
