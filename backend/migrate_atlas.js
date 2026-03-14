const { MongoClient } = require('mongodb');

// Database URIs
const SOURCE_URI = 'mongodb+srv://prachi:7694900512@cluster0.nd3xlri.mongodb.net/zeto-mart';
const DEST_URI = 'mongodb+srv://rounak_user:raunak123@cluster0.dpunra8.mongodb.net/Justi';

async function migrate() {
    console.log('🚀 Starting Database Migration...');
    
    const sourceClient = new MongoClient(SOURCE_URI);
    const destClient = new MongoClient(DEST_URI);

    try {
        await sourceClient.connect();
        await destClient.connect();
        console.log('✅ Connected to both Source and Destination databases');

        const sourceDb = sourceClient.db(); // Uses the database name from the URI (zeto-mart)
        const destDb = destClient.db();     // Uses the database name from the URI (Justi)

        // Get all collections from the source database
        const collections = await sourceDb.listCollections().toArray();
        console.log(`📦 Found ${collections.length} collections in source database`);

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            
            // Skip system collections
            if (collectionName.startsWith('system.')) {
                console.log(`⏩ Skipping system collection: ${collectionName}`);
                continue;
            }

            console.log(`\n---------------------------------------------------------`);
            console.log(`🔄 Migrating collection: "${collectionName}"...`);
            
            const sourceCol = sourceDb.collection(collectionName);
            const destCol = destDb.collection(collectionName);

            // OPTIONAL: Clear destination collection before migration
            // If you want to MERGE data, leave this commented out.
            // If you want a CLEAN SLATE, uncomment the line below:
            // await destCol.deleteMany({}); console.log(`   🗑️ Cleared destination collection.`);

            // 2. Fetch all documents from source
            const totalDocs = await sourceCol.countDocuments();
            if (totalDocs === 0) {
                console.log(`   ℹ️ Collection "${collectionName}" is empty. Skipping.`);
                continue;
            }

            console.log(`   📄 Total documents to migrate: ${totalDocs}`);

            // 3. Migrate in batches to prevent memory issues for large collections
            const cursor = sourceCol.find({});
            let batch = [];
            let migratedCount = 0;
            const BATCH_SIZE = 1000;

            while (await cursor.hasNext()) {
                const doc = await cursor.next();
                batch.push(doc);

                if (batch.length === BATCH_SIZE) {
                    await destCol.insertMany(batch);
                    migratedCount += batch.length;
                    console.log(`   ✅ Migrated ${migratedCount}/${totalDocs} documents...`);
                    batch = [];
                }
            }

            // Insert remaining documents in the last batch
            if (batch.length > 0) {
                await destCol.insertMany(batch);
                migratedCount += batch.length;
                console.log(`   ✅ Migrated ${migratedCount}/${totalDocs} documents.`);
            }

            // 4. Copy Indexes
            try {
                const indexes = await sourceCol.listIndexes().toArray();
                if (indexes.length > 1) { // 1 is default _id index
                    console.log(`   📑 Copying ${indexes.length - 1} indexes...`);
                    for (const index of indexes) {
                        if (index.name === '_id_') continue;
                        
                        try {
                            const { v, ns, ...indexOptions } = index;
                            const key = indexOptions.key;
                            delete indexOptions.key;
                            
                            await destCol.createIndex(key, indexOptions);
                        } catch (indexCreateErr) {
                            if (indexCreateErr.code === 85) { // IndexOptionsConflict
                                console.warn(`   ⚠️ Index "${index.name}" already exists with different options. Skipping.`);
                            } else {
                                throw indexCreateErr;
                            }
                        }
                    }
                    console.log(`   ✅ Indexes copied.`);
                }
            } catch (indexErr) {
                console.warn(`   ⚠️ Could not copy indexes for ${collectionName}: ${indexErr.message}`);
            }
        }

        console.log('\n✨ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
    } finally {
        await sourceClient.close();
        await destClient.close();
        console.log('🔌 Connections closed.');
    }
}

migrate();
