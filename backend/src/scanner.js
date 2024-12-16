const fs = require('fs');
const path = require('path');
const os = require('os');
const { indexFileMetadata } = require('./esClient');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const allowedExtensions = ['.txt', '.pdf', '.docx', '.ppt', '.mp3', '.wav', '.mp4', '.mkv', '.avi'];

function isAllowedFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(ext);
}

function scanDirectory(dirPath) {
  const results = [];
  let files;

  try {
    files = fs.readdirSync(dirPath);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      console.warn(`Skipping directory due to permission issues: ${dirPath}`);
      return []; 
    }
    throw err;  
  }

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    let stats;

    try {
      stats = fs.statSync(fullPath);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        console.warn(`Skipping file due to permission issues: ${fullPath}`);
        return;  
      }
      throw err;  
    }

    if (stats.isDirectory()) {
      results.push(...scanDirectory(fullPath));
    } else if (isAllowedFileType(file)) {
      const fileMetadata = {
        path: fullPath,
        name: file,
        type: path.extname(file),
        size: stats.size,
        dateCreated: stats.birthtime.toISOString(),  
        dateModified: stats.mtime.toISOString(),    
        content: '', 
      };

      // Handle text-based files (.txt)
      if (path.extname(file) === '.txt') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        fileMetadata.content = content.substring(0, 1000);  // Get the first 1000 characters
      }

      // Handle PDF files (.pdf)
      else if (path.extname(file) === '.pdf') {
        const buffer = fs.readFileSync(fullPath);
        pdfParse(buffer).then(data => {
          fileMetadata.content = data.text.substring(0, 1000);  // Get the first 1000 characters
        }).catch(err => {
          console.error(`Error parsing PDF file: ${fullPath}`, err);
          fileMetadata.content = '[PDF Parsing Failed]';
        });
      }

      // Handle DOCX files (.docx)
      else if (path.extname(file) === '.docx') {
        const buffer = fs.readFileSync(fullPath);
        mammoth.extractRawText({ buffer: buffer }).then(result => {
          fileMetadata.content = result.value.substring(0, 1000);  // Get the first 1000 characters
        }).catch(err => {
          console.error(`Error parsing DOCX file: ${fullPath}`, err);
          fileMetadata.content = '[DOCX Parsing Failed]';
        });
      }

      // Handle other file types like .mp3, .mp4, .avi by skipping content
      else {
        fileMetadata.content = '[Binary File - Content Skipped]';
      }

      results.push(fileMetadata);
    }
  });

  return results;
}

async function saveMetadata() {
  const homeDir = os.homedir(); 
  const metadata = scanDirectory(homeDir);
  console.log('Metadata collected:', metadata);

  // Save metadata to a JSON file
  fs.writeFileSync('file_metadata.json', JSON.stringify(metadata, null, 2));

  // Index the metadata in Elasticsearch
  for (const fileMetadata of metadata) {
    await indexFileMetadata(fileMetadata);
  }
}

module.exports = { saveMetadata };
