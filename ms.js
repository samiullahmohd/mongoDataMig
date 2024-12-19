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

async function transferData() {
  // const sourceUri =
  //   "mongodb+srv://deepakkumar:M92xjniipmDT8rtK@cluster0.z2d9d.mongodb.net/testLive?retryWrites=true&w=majority&appName=Cluster0";
  //   const targetUri =
  // "mongodb+srv://deepakkumar:M92xjniipmDT8rtK@cluster0.z2d9d.mongodb.net/andhra?retryWrites=true&w=majority&appName=Cluster0";
  // const targetUri = "mongodb://localhost:27017/andhra2";

  const sourceUri =
    "mongodb+srv://subhabiswal100:0vsTSpl3PYHu90yv@cluster0.piyhowh.mongodb.net/abcd";

  const targetUri =
    "mongodb+srv://subhabiswal100:0vsTSpl3PYHu90yv@cluster0.piyhowh.mongodb.net/eee";

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
      // Clear the collection if it exists
      await targetDb.collection(collection.name).deleteMany({});

      // Check and log if the collection is empty
      const emptyCount = await targetDb
        .collection(collection.name)
        .countDocuments();
      console.log(
        `Collection ${collection.name} is now empty with ${emptyCount} documents.`
      );

      // Retrieve all documents from the source collection
      const data = await sourceDb.collection(collection.name).find().toArray();

      // remove extra keys from documents
      const refinedData = data.map((doc) => {
        const cleanedDoc = validateDocumentFormat(doc);
        return cleanedDoc;
      });

      // Insert the data into the target collection
      await targetDb.collection(collection.name).insertMany(refinedData);

      console.log(
        `Transferred ${data.length} documents from ${collection.name}`
      );
    }
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

transferData().catch(console.error);
