// migrate data with proper format

const { MongoClient } = require("mongodb");

// Define a list of possible field names for the pdf URL
const possiblePdfUrlKeys = [
  "pdfUrl",
  "url",
  "pdf",
  "link",
  "pdfLink",
  "pdfLinks",
  "pdfUrls",
];

// Function to get the pdfUrl key and value from a document, checking for all possible key names
function getPdfUrlKeyAndValue(doc) {
  for (const key of possiblePdfUrlKeys) {
    if (doc.hasOwnProperty(key)) {
      return { key, value: doc[key] }; // Return both the key and the value
    }
  }
  return null; // Return null if none of the keys are found
}

const updateDocs = async () => {
  const db1 =
    "mongodb+srv://deepakkumar:M92xjniipmDT8rtK@cluster0.z2d9d.mongodb.net/testDb?retryWrites=true&w=majority&appName=Cluster0";

  const db2 = "mongodb://localhost:27017/andhra2"; // connect prod db

  const sourceClient = new MongoClient(db1);
  const targetClient = new MongoClient(db2);

  try {
    const sourceDb = sourceClient.db();
    const targetDb = targetClient.db();

    const collections = await targetDb.listCollections().toArray();

    for (let i = 0; i < collections.length; i++) {
      const processedPdfUrls = new Set(); // Track processed pdfUrls
      let limit = 100;
      let offset = 0;
      let docs = {};

      while (true) {
        // let sourceDocuments =. fetch from the local db collection using limit and offset
        const sourceDocuments = await sourceDb
          .collection(collections[i].name)
          .find()
          .skip(offset)
          .limit(limit)
          .toArray();

        // format the document and push to docs variable
        for (const doc of sourceDocuments) {
          docs[doc["pdfUrls"]] = {
            title: doc["title"],
            tagString: doc["tagString"],
          };
        }

        // if we are getting less documents than limit then there is no documents left in the collection, else update offset
        if (sourceDocuments.length < limit) {
          break;
        } else {
          offset += limit;
        }
      }

      offset = 0;
      while (true) {
        // let targetDocuments =. fetch from the local db collection using limit and offset
        const targetDocuments = await targetDb
          .collection(collections[i].name)
          .find()
          .skip(offset)
          .limit(limit)
          .toArray();

        const bulkOps = []; // To collect bulk update operations

        // Processing the documents
        for (const doc of targetDocuments) {
          // Use the function to get the correct key and its value
          const pdfData = getPdfUrlKeyAndValue(doc);

          if (pdfData && docs.hasOwnProperty(pdfData.value)) {
            const updateDoc = docs[pdfData.value];

            // Add to processedPdfUrls set
            processedPdfUrls.add(pdfData.value);

            // Check if the key is "pdfUrl"
            if (pdfData.key !== "pdfUrl") {
              // If it's not "pdfUrl", update the key to "pdfUrl"
              bulkOps.push({
                updateOne: {
                  filter: { [pdfData.key]: pdfData.value }, // Filter by the original key
                  update: {
                    $set: {
                      title: updateDoc.title,
                      tagString: updateDoc.tagString,
                      pdfUrl: pdfData.value, // Add pdfUrl field
                    },
                    // Remove the old key (if you want to remove the original key)
                    $unset: {
                      [pdfData.key]: "", // Remove the old key
                    },
                  },
                },
              });
            } else {
              // If the key is already "pdfUrl", skip the update
              bulkOps.push({
                updateOne: {
                  filter: { [pdfData.key]: pdfData.value }, // Filter by pdfUrl key
                  update: {
                    $set: {
                      title: updateDoc.title,
                      tagString: updateDoc.tagString,
                    },
                  },
                },
              });
            }
          }
        }

        // If there are any update operations to perform, do them in bulk
        if (bulkOps.length > 0) {
          // Perform the bulkWrite operation
          const result = await targetDb
            .collection(collections[i].name)
            .bulkWrite(bulkOps);
        }

        if (targetDocuments.length < limit) {
          break;
        } else {
          offset += limit;
        }
      }

      // Insert extra data from source to target
      const extraDocs = [];
      for (const [pdfUrl, doc] of Object.entries(docs)) {
        if (!processedPdfUrls.has(pdfUrl)) {
          extraDocs.push({
            title: doc.title,
            tagString: doc.tagString,
            pdfUrl: pdfUrl,
          });
        }
      }

      if (extraDocs.length > 0) {
        await targetDb.collection(collections[i].name).insertMany(extraDocs);
      }
      
      console.log("collection work done", collections[i].name);
    }
  } catch (error) {
    console.log(error);
  }
};

updateDocs();
