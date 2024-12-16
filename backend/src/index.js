const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');
const { checkConnection } = require('./esClient');
const { saveMetadata } = require('./scanner');

const app = express();
const port = 3000;

app.use(cors());

// Elasticsearch client setup
const client = new Client({
  node: 'https://localhost:9200',
  auth: { username: 'elastic', password: 'uUyw3pMfml0MLow-+T_F' },
  tls: { rejectUnauthorized: false }
});



// Search by filename
async function searchFileByName(fileName) {
  try {
    const response = await client.search({
      index: 'file_metadata',
      body: {
        query: {
          match: { name: fileName },
        },
      },
    });

    if (response.hits.total.value > 0) {
      console.log('Search results:');
      response.hits.hits.forEach((hit, index) => {
        console.log(`Result ${index + 1}:`, hit._source);
      });
      return response.hits.hits.map(hit => hit._source);
    } else {
      console.log(`No results found for filename: ${fileName}`);
      return [];
    }
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Error querying Elasticsearch');
  }
}


//

async function searchFileByType(fileType) {
  try {
    const response = await client.search({
      index: 'file_metadata',
      body: {
        query: {
          term: {
            type: {
              value: fileType 
            }
          }
        },
        _source: true, 
      },
    });

    if (response.hits.total.value > 0) {
      console.log('Search results by type:');
      response.hits.hits.forEach((hit, index) => {
        console.log(`Result ${index + 1}:`, hit._source);
      });
      return response.hits.hits.map(hit => hit._source);
    } else {
      console.log(`No results found for file type: ${fileType}`);
      return [];
    }
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Error querying Elasticsearch');
  }
}


//
async function searchFileByDate(date) {
  try {
    const response = await client.search({
      index: 'file_metadata',
      body: {
        query: {
          range: {
            dateCreated: {  
              gte: date,  
              lte: date,  
              format: "yyyy-MM-dd" 
            }
          }
        },
        _source: true, 
      },
    });

    if (response.hits.total.value > 0) {
      console.log('Search results by date:');
      response.hits.hits.forEach((hit, index) => {
        console.log(`Result ${index + 1}:`, hit._source);
      });
      return response.hits.hits.map(hit => hit._source);
    } else {
      console.log(`No results found for date: ${date}`);
      return [];
    }
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Error querying Elasticsearch');
  }
}


// Search function to filter by directory (folder)
async function searchFileByDirectory(directoryPath) {
  try {
    const response = await client.search({
      index: 'file_metadata',  
      body: {
        query: {
          wildcard: {
            path: `*${directoryPath}*`  // Wildcard to search within the directory
          }
        },
        _source: ['path', 'name', 'type', 'size', 'dateCreated', 'dateModified'],  
      },
    });

    console.log('Elasticsearch response:', response);  

    if (response.hits && response.hits.hits) {
      if (response.hits.total.value > 0) {
        console.log('Search results for directory:');
        return response.hits.hits.map(hit => hit._source);  
      } else {
        console.log(`No results found for directory: ${directoryPath}`);
        return [];
      }
    } else {
      console.error('Error: No hits found in the response.');
      return [];
    }
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Error querying Elasticsearch');
  }
}



// Endpoint for searching by filename
app.get('/search', async (req, res) => {
  const filename = req.query.filename;

  if (!filename) {
    return res.status(400).json({ error: 'Filename query parameter is required' });
  }

  try {
    const results = await searchFileByName(filename);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint for searching by file type
app.get('/filter', async (req, res) => {
  const fileType = req.query.type;

  if (!fileType) {
    return res.status(400).json({ error: 'File type query parameter is required' });
  }

  try {
    const results = await searchFileByType(fileType);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/date', async (req, res) => {
  const { date } = req.query; 
  console.log('Received date:', date); 

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required' });
  }

  try {
    const results = await searchFileByDate(date); 
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error:', error); 
    return res.status(500).json({ error: error.message });
  }
});

app.get('/filter-by-directory', async (req, res) => {
  const { directory } = req.query;

  if (!directory) {
    return res.status(400).json({ error: 'Directory query parameter is required' });
  }

  try {
    const results = await searchFileByDirectory(directory);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


async function main() {
  await checkConnection(); 
  await saveMetadata();    
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

main();
