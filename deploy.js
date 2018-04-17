const cmd = require('node-cmd');
const fs = require('fs-extra');
const co = require('co');
const archiver = require('archiver');
const pkg = fs.readJsonSync('./package.json');

/**
 * Run system command
 *
 * @param cmdString
 * @returns {Promise}
 */
const systemCmd = cmdString => {
  return new Promise((resolve) => {
    cmd.get(
      cmdString,
      (data, err, stderr) => {
        console.log(cmdString);
        console.log(data);
        if (err) {
          console.log(err);
        }
        if (stderr) {
          console.log(stderr);
        }
        resolve(data);
      }
    );
  });
}

const zipPromise = (src, dist) => {
  return new Promise((resolve, reject) => {
    const archive = archiver.create('zip', {});
    const output = fs.createWriteStream(dist);

    // listen for all archive data to be written
    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('Archiver has been finalized and the output file descriptor has closed.');
      resolve();
    });

    // good practice to catch this error explicitly
    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(src).finalize();
  });
}

co(function* () {
  try {
    fs.mkdirsSync(`GoogleSpreadSheet`);
    fs.mkdirsSync(`build`);
    fs.copySync(`./composer.json`, 'GoogleSpreadSheet/composer.json');
    fs.copySync(`./composer.lock`, `GoogleSpreadSheet/composer.lock`);
    fs.copySync(`./LICENSE`, `GoogleSpreadSheet/LICENSE`);
    fs.copySync(`./README.md`, `GoogleSpreadSheet/README.md`);
    fs.copySync(`./Engine.php`, `GoogleSpreadSheet/Engine.php`);
    fs.copySync(`./Hook.php`, `GoogleSpreadSheet/Hook.php`);
    fs.copySync(`./Api.php`, `GoogleSpreadSheet/Api.php`);
    fs.copySync(`./GET`, `GoogleSpreadSheet/GET`);
    fs.copySync(`./POST`, `GoogleSpreadSheet/POST`);
    fs.copySync(`./ServiceProvider.php`, `GoogleSpreadSheet/ServiceProvider.php`);
    yield systemCmd(`cd ./GoogleSpreadSheet; composer install`);
    yield zipPromise(`GoogleSpreadSheet`, `./build/GoogleSpreadSheet.zip`);
    fs.removeSync(`GoogleSpreadSheet`);
    yield systemCmd('git add -A');
    yield systemCmd(`git commit -m "v${pkg.version}"`);
    yield systemCmd('git push');
  } catch (err) {
    console.log(err);
  }
});
