// watcher.js
const chokidar = require('chokidar');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Function to monitor the directory, skipping files without permissions
function monitorDirectory(directory) {
    const watcher = chokidar.watch(directory, {
        ignored: /(^|[\/\\])\../,  // Ignore dotfiles
        persistent: true,
    });

    watcher
        .on('add', (filePath) => {
            fs.access(filePath, fs.constants.R_OK, (err) => {
                if (err) {
                    console.log(`Skipping file (no permission): ${filePath}`);
                } else {
                    console.log(`File added: ${filePath}`);
                }
            });
        })
        .on('change', (filePath) => {
            fs.access(filePath, fs.constants.R_OK, (err) => {
                if (err) {
                    console.log(`Skipping file (no permission): ${filePath}`);
                } else {
                    console.log(`File changed: ${filePath}`);
                }
            });
        })
        .on('unlink', (filePath) => {
            console.log(`File removed: ${filePath}`);
        })
        .on('error', (err) => {
            console.error('Watcher error:', err);
        });

    console.log(`Watching for changes in: ${directory}`);
}

// Export the function for use in other files
module.exports = { monitorDirectory };
