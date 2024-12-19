// clean and migrate data
const { MongoClient } = require("mongodb");

const pdfSchema = {
    title: "string",
    pdfUrls: "string",
    tagString: "string",
    timestamp: "date",
};

// Function to validate document format against the pdfSchema
function validateDocumentFormat(doc) {
    const keys = Object.keys(pdfSchema);
    const filteredDoc = {};

    keys.forEach((key) => {
        if (doc[key] !== undefined) {
            filteredDoc[key] = doc[key];
        }
    });

    // Check if any keys not in the schema are present (excluding _id or __v)
    const extraKeys = Object.keys(doc).filter(
        (key) => !keys.includes(key) && key !== "_id" && key !== "__v"
    );
    if (extraKeys.length > 0) {
        // console.log(`Document in collection has invalid fields: ${extraKeys.join(", ")}`);
    }

    return filteredDoc;
}

// Function to remove unwanted patterns from title
function removePatterns(input) {
    const patterns = [
      /view pdf/i,
      /Click here to download/i,
      /Click here to see/i,
      /click here to view/i,
      /click here to/i,
      /click here/i,
      /click to download/i,
      /click to/i,
      /click/i,
      /download/i,
      /download pdf/i,
      /\(\d+\s?(kb|mb)\)/gi, // Matches patterns like "(20kb)", "(30 mb)"
      /\d+\s?(kb|mb)/gi, // Matches patterns like "270 kb", "23mb"
    ];

    const combinedPattern = new RegExp(patterns.map((pattern) => pattern.source).join("|"), "gi");
    return input.replace(combinedPattern, "").trim();
}

// Function to clean up tagString by removing extra spaces and correcting the divider
function cleanTagString(tagString) {
    return tagString
        .trim() // Trim spaces from the beginning and end
        .replace(/\s+/g, " ") // Replace multiple spaces with a single space
        .replace(/<-->/g, "<->"); // Replace '<-->' with '<->'
}

function removeTagAndSpaces(cleanedTagString) {
    return cleanedTagString
        .replace(/<->/g, "") // Remove all occurrences of '<->'
        .trim() // Trim spaces from the beginning and end
        .replace(/\s+/g, " "); // Replace multiple spaces with a single space
}

async function transferData() {
    const sourceUri = "mongodb://localhost:27017/andhra3";
    const targetUri = "mongodb://localhost:27017/andhra4";

    const sourceClient = new MongoClient(sourceUri);
    const targetClient = new MongoClient(targetUri);

    try {
        await sourceClient.connect();
        await targetClient.connect();

        const sourceDb = sourceClient.db();
        const targetDb = targetClient.db();

        const collections = await sourceDb.listCollections().toArray();

        // for (const collection of collections) {

        //     const data = await sourceDb.collection(collection.name).find().toArray();
        //     await targetDb.collection(collection.name).insertMany(data);
        //     console.log(`Transferred ${data.length} documents from ${collection.name}`);
        // }
        for (const collection of collections) {
            const targetCollectionExists = await targetDb
                .listCollections({ name: collection.name })
                .hasNext();

            // check for presence of collection
            if (targetCollectionExists) {
                console.log(
                    `Collection ${collection.name} already exists in the target database. Skipping...`
                );
            }

            // else add it to db
            // {
            //     const data = await sourceDb.collection(collection.name).find().toArray();
            //     await targetDb.collection(collection.name).insertMany(data);
            //     console.log(`Transferred ${data.length} documents from ${collection.name}`);
            // }

            // else add it to db by modifying data
            else {
                const data = await sourceDb.collection(collection.name).find().toArray();

                const refinedData = data.map((doc) => {
                    const cleanedDoc = validateDocumentFormat(doc);

                    if (cleanedDoc.tagString) {
                        cleanedDoc.tagString = cleanTagString(cleanedDoc.tagString);
                    }

                    if (cleanedDoc.title) {
                        cleanedDoc.title = removePatterns(cleanedDoc.title);
                        if (cleanedDoc.title.length < 5) {
                            console.log(cleanedDoc);

                            if (cleanedDoc.title.length < 1) {
                                cleanedDoc.title = removeTagAndSpaces(cleanedDoc.title);
                                console.log(cleanedDoc.title);
                            }
                        }
                    } else {
                        cleanedDoc.title = removeTagAndSpaces(cleanedDoc.title);
                    }

                    return cleanedDoc;
                });

                await targetDb.collection(collection.name).insertMany(refinedData);
                console.log(
                    `Transferred ${refinedData.length} cleaned documents from ${collection.name}`
                );
            }
        }
    } finally {
        await sourceClient.close();
        await targetClient.close();
    }
}

transferData().catch(console.error);
