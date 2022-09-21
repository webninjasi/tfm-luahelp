const fs = require("fs");
const parser = require("./parser.js");

const latest = fs.readFileSync('raw/latest', 'utf8');
const latestVer = latest.match(/apiVersion<font color='#60608F'> : (.+?)<\/font>/)?.[1]
                  || latest.match(/<V><font size='14'>Version (.+?)<\/font><\/V>/)?.[1];
const tfmVer = latest.match(/transformiceVersion<font color='#60608F'> : (.+?)<\/font>/)?.[1];

let changeNum = 0;

const getLatestVer = () => latestVer + "-" + tfmVer + (changeNum ? ("-" + changeNum) : "");
const openSafe = (name) => {
  try {
    return fs.readFileSync(name, 'utf8');
  }
  catch (err) {
    if (err && err.code === 'ENOENT') {
      return "";
    } else {
      throw err;
    }
  }
}

if (!latestVer) {
  console.error("API version not found");
  process.exit(1);
}

if (isNaN(parseFloat(latestVer))) {
  console.error("API version number is invalid:", latestVer);
  process.exit(1);
}

if (!tfmVer) {
  console.error("Transformice version not found");
  process.exit(1);
}

if (isNaN(parseFloat(tfmVer))) {
  console.error("Transformice version number is invalid:", tfmVer);
  process.exit(1);
}

const versions = openSafe('versions').split('\n').map(v => v.trim()).filter(v => v != 'latest');
let newVersion = getLatestVer();

while (versions.indexOf(newVersion) != -1) {
  newVersion = getLatestVer();
  const versionContent = openSafe('raw/' + newVersion);

  if (versionContent == latest) {
    console.error("This version already exists");
    process.exit(1);
  }

  changeNum ++;
}

const parsed = parser.parseHelp(latest);

fs.writeFileSync('raw/' + newVersion, latest);
fs.writeFileSync('parsed/latest', JSON.stringify(parsed));
fs.writeFileSync('parsed/' + newVersion, JSON.stringify(parsed));
fs.writeFileSync('versions', ([ newVersion, ...versions ]).join('\n'));
console.log("New version is created:", newVersion);
