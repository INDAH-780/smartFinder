const { Client } = require('@elastic/elasticsearch');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // If necessary for local testing or insecure environments

const client = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'uUyw3pMfml0MLow-+T_F',  
  },
  ssl: {
    rejectUnauthorized: false,  
  },
});

// Check connection to the Elasticsearch cluster
async function checkConnection() {
  try {
    const health = await client.cluster.health();
    console.log('Cluster health:', health);
  } catch (error) {
    console.error('Elasticsearch connection error:', error);
  }
}

// Ensure the index exists
async function createIndex() {
  const indexExists = await client.indices.exists({ index: 'file_metadata' });
  
  if (!indexExists.body) {
    try {
      // Create the index with the appropriate mappings
      await client.indices.create({
        index: 'file_metadata',
        body: {
          mappings: {
            properties: {
              path: { type: 'keyword' },
              name: { type: 'text' },
              type: { type: 'keyword' },
              size: { type: 'long' },
              dateCreated: { type: 'date' },
              dateModified: { type: 'date' },
              content: { type: 'text' },
            },
          },
        },
      });
      console.log('Index "file_metadata" created successfully.');
    } catch (error) {
      console.error('Error creating index:', error);
    }
  } else {
    console.log('Index "file_metadata" already exists.');
  }
}

// Index file metadata, checking for duplicates and avoiding re-indexing
async function indexFileMetadata(metadata) {
  try {
    // Check if a document with the same path already exists
    const existingDocs = await client.search({
      index: 'file_metadata',
      body: {
        query: {
          match: { path: metadata.path }, 
        },
      },
    });

    if (existingDocs.hits.total.value > 0) {
      // If duplicates exist, delete them all except one
      const docIds = existingDocs.hits.hits.map(hit => hit._id);
      for (let i = 1; i < docIds.length; i++) {
        await client.delete({
          index: 'file_metadata',
          id: docIds[i],
        });
      }

      console.log(`File metadata for path "${metadata.path}" already exists. Removed duplicates.`);
      return; // Skip re-indexing
    }

    // Proceed with indexing if no existing document is found
    await client.index({
      index: 'file_metadata',
      body: metadata,
      refresh: true,
    });

    console.log('File metadata indexed successfully!');
  } catch (error) {
    console.error('Error indexing file metadata:', error);
  }
}

module.exports = { checkConnection, createIndex, indexFileMetadata };
