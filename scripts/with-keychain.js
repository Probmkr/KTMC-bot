#!/usr/bin/env node
// Keychain から環境変数を読み込んでコマンドを実行する
// すでにシステム環境変数として設定済みの変数は上書きしない

const keytar = require('keytar');
const { spawn } = require('child_process');

const SERVICE = 'ktmc-bot';
const KEYS = ['BOT_TOKEN', 'APP_ID', 'DATABASE_URL', 'GUILD_ID'];

(async () => {
  const env = { ...process.env };

  for (const key of KEYS) {
    if (!env[key]) {
      const value = await keytar.getPassword(SERVICE, key);
      if (value) env[key] = value;
    }
  }

  const [cmd, ...args] = process.argv.slice(2);
  const child = spawn(cmd, args, { env, stdio: 'inherit', shell: true });
  child.on('exit', code => process.exit(code ?? 0));
})();
