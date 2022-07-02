const fs = require("fs");

const latest = fs.readFileSync('raw/latest', 'utf8');
const latestVer = latest.match(/<V><font size='14'>Version (.+?)<\/font><\/V>/)?.[1];

let changeNum = 0;

const getLatestVer = () => latestVer + (changeNum ? ("-" + changeNum) : "");
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
  console.error("Latest version not found");
  process.exit(1);
}

if (isNaN(parseFloat(latestVer))) {
  console.error("Version number is invalid:", latestVer);
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

fs.writeFileSync('raw/' + newVersion, latest);
fs.writeFileSync('versions', ([ 'latest', newVersion, ...versions ]).join('\n'));
console.log("New version is created:", newVersion);
