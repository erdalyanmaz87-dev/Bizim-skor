import {readFile, writeFile, copyFile} from 'node:fs/promises';
import '../mobile/scripts/build-web.mjs';

const directory = new URL('../mobile/www/', import.meta.url);
const page = new URL('index.html', directory);
let html = await readFile(page, 'utf8');
html = html.replace('<script src="account-ui.js"></script>', '<script src="first-run-preview.js"></script><script src="account-ui.js"></script>');
html = html.replace("connect-src 'self' https://paevhzaixlozrrggnzni.supabase.co wss://paevhzaixlozrrggnzni.supabase.co", "connect-src 'self'");
await writeFile(page, html);
await copyFile(new URL('first-run-preview.js', import.meta.url), new URL('first-run-preview.js', directory));
