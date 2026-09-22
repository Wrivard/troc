import assert from 'node:assert/strict';
import process from 'node:process';
process.env.NODE_ENV = 'production';
process.env.CATALOG_MODE = 'demo';
process.env.PUBLIC_SITE_URL = 'https://troc.example';
const {default: app} = await import('../api/index.js');
const server = app.listen(0, '127.0.0.1', async () => {
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const path of ['/', '/product/pokemon-northern-spark?lang=fr', '/api/catalog/page?path=/search']) {
      const response = await globalThis.fetch(origin + path);
      assert.equal(response.status, 200, path);
      assert.ok((await response.text()).length > 100, path);
    }
    console.log('Prebundled production serverless entry: SSR and internal catalog API passed.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally { server.close(); }
});
