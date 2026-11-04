import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('file sharing never exposes a storage root or external directory',()=>{
 const xml=readFileSync(new URL('../android/app/src/main/res/xml/file_paths.xml',import.meta.url),'utf8');
 assert.doesNotMatch(xml,/<(?:root|external|external-files|external-cache)-path\b/);
 assert.doesNotMatch(xml,/path\s*=\s*["'](?:\.|\/|)["']/);
 assert.match(xml,/<cache-path\b[^>]*path="shared-images\/"/);
});
