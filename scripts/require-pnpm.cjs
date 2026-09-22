if (!process.env.npm_config_user_agent?.startsWith('pnpm/10.34.5 ')) {
  console.error('Use pnpm 10.34.5, as pinned in package.json.');
  process.exit(1);
}
