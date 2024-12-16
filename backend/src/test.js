const { scanDirectory } = require('./scanner');
const { monitorDirectory } = require('./watcher');
const os = require('os');

// Get the home directory of the current user
const directoryToWatch = os.homedir(); // Use home directory for watching
monitorDirectory(directoryToWatch);

(async () => {
    const directoryToScan = os.homedir(); // Start scanning from the home directory
    try {
        const result = await scanDirectory(directoryToScan);
        //console.log('Scanned Files:', result);
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
