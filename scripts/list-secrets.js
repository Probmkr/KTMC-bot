#!/usr/bin/env node
// Keychain に登録されている ktmc-bot のエントリを一覧表示する

const keytar = require('keytar');

const SERVICE = 'ktmc-bot';

(async () => {
  const credentials = await keytar.findCredentials(SERVICE);
  if (credentials.length === 0) {
    console.log('登録されているエントリはありません');
    return;
  }

  console.log(`=== ${SERVICE} — Keychain エントリ一覧 ===\n`);
  for (const { account } of credentials) {
    console.log(`  ${account}`);
  }
})();
