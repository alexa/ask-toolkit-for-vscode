const jsonfile = require('jsonfile');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

jsonfile.readFile(packageJsonPath, (err, pkg) => {
    if (err) {
        console.log(err)
    } else {
        pkg.main = "./out/src/extension";
        jsonfile.writeFile(packageJsonPath, pkg, { spaces: 4 }, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.warn('Modified the main property in package.json to point to out/src/extension')
            }
        })
    }
});