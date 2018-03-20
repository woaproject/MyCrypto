// Makes for a deterministic cache file by sorting it
'use strict';
const fs = require('fs');
const klawSync = require('klaw-sync');

const CACHE_FILE_REGEX = /.*icons-[a-z0-9]*\/\.cache$/;
const findCacheFile = item => CACHE_FILE_REGEX.test(item.path);

function SortCachePlugin() {};
SortCachePlugin.prototype.apply = function(compiler) {
  compiler.plugin('done', (stats) => {
    const buildDir = stats.compilation.compiler.outputPath;
    const cacheFilePaths = klawSync(buildDir, { filter: findCacheFile });

    if (!cacheFilePaths.length) {
      console.warn('No cache icon cache file found for sorting.');
      return;
    }

    if (cacheFilePaths.length > 1) {
      throw new Error('More than one possible icon .cache file detected', cacheFilePaths);
    }

    const cacheFilePath = cacheFilePaths[0].path;
    const rawCacheFile = fs.readFileSync(cacheFilePath, 'utf8');
    const cache = JSON.parse(rawCacheFile);

    cache.result.files = cache.result.files.sort();

    fs.writeFileSync(cacheFilePath, JSON.stringify(cache), 'utf8');
  });
};

module.exports = SortCachePlugin;
