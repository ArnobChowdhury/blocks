import { replaceInFileSync } from 'replace-in-file';
import fs from 'fs-extra/esm';
import path from 'path';
import { fileURLToPath } from 'url';
// const __dirname = import.meta.dirname;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// fix long prisma loading times caused by scanning from process.cwd(), which returns "/" when run in electron
// (thus it scans all files on the computer.) See https://github.com/prisma/prisma/issues/8484
const files = path.join(__dirname, 'src', 'generated', 'client', '**/*.js');
console.log('looking at files ', files);
const results = replaceInFileSync({
  files: files,
  from: /process.cwd\(\)/g,
  to: `require('electron').app.getAppPath()`,
  countMatches: true,
});
console.log('Replacement results:', results);

// Copy the generated prisma client to the dist folder
fs.copySync(
  path.join(__dirname, 'src', 'generated'),
  path.join(__dirname, 'release', 'app', 'dist', 'generated'),
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filter: (src, dest) => {
      // Prevent duplicate copy of query engine. It will already be in extraResources in electron-builder.yml
      if (
        src.match(/query_engine/) ||
        src.match(/libquery_engine/) ||
        src.match(/esm/)
      ) {
        return false;
      }
      return true;
    },
  },
);

fs.copySync(
  path.join(__dirname, 'prisma'),
  path.join(__dirname, 'release', 'app', 'prisma'),
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filter: (src, dest) => {
      // Prevent duplicate copy of query engine. It will already be in extraResources in electron-builder.yml
      const regexForDbFile = /\.db$/;
      if (regexForDbFile.test(src)) {
        return false;
      }
      return true;
    },
  },
);

console.log('Done copying files');
