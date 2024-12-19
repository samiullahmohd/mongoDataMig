const { MongoClient } = require("mongodb");

// MongoDB connection URI
const uri = "mongodb://localhost:27017"; // Replace with your MongoDB URI
const dbName = "scrap_yas"; // Replace with your database name
const collectionName = "yas"; // Replace with your collection name

// Function to check and update the tagstring
async function updateDocs() {
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB client
    await client.connect();
    console.log("Connected to MongoDB");

    // Get the database and collection
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Retrieve all documents from the collection
    const documents = await collection.find({}).toArray();

    let counter = 1;

    // Loop through each document
    for (const doc of documents) {
      // Rename "pdfUrl" to "pdfUrls" if necessary
      if (doc.pdfUrl) {
        doc.pdfUrls = doc.pdfUrl;
        delete doc.pdfUrl;
      }

      let title = doc.title;

      let tagstring = doc.tagString;
      console.log(`Processing document with _id: ${doc._id} and _title: ${title}`);

      // Handle `tagString` cleanup
      // if (tagstring) {
      //   tagstring = tagstring
      //     .replace(/^home\s*/i, "")
         
      //     .replace(/^moe\s*/i, "")
      //     .replace(/^<->/, "")
      //     .replace(/<->$/, "")
      //     .replace(/<->\s*<->+/g, "<->")
      //     .trim()
      //     .replace(/\s+/g, " ")
      //     .replace(/<-->/g, "<->")
      //     .replace(/\|/g, "<->")
      //     .replace(/#skipCont/g, " ")
      //     .replace(/%20/g, " ")
      //     .replace(/%/g, " ");

      //   const siteName = "Ministry of Housing and Urban Affairs";
      //   if (!tagstring.startsWith(`${siteName}`)) {
      //     tagstring = `${siteName} <-> ${tagstring}`;
      //   }
      // }

        // Check if the title matches specific patterns or is a numeric value
      let isNum=Number(title) 
      if (
        /^(photos|img|order|docs|details|subject|aaaaaa|click here|circular|annexure|scan|dummy|file|doc|download|more information|photo)/i.test(title) ||
        !isNaN(isNum) ||
        /^\d{2}\.\d{2}\.\d{4}[.,]?$/.test(title) || // Matches date formats like "03.10.2013," or "04.03.2024."
        /^\(.*\)$/.test(title) || // Matches patterns like "(1)"
        /^\d+\s*\d*$/.test(title) // Matches patterns like "5963151733 0 0"
      ) {  //Review 
        const tagSegments = tagstring.split(" <-> ");
        title = tagSegments[tagSegments.length - 1]+Math.floor(Math.random()*21) || title;
        console.log(`Updated title to: ${title}`);
      }

      // Sanitize the title further if necessary
      const sanitizeTitle = (input) => {
        return input
          .replace(/_/g, " ") // Replace underscores with spaces
          .replace(/http:\/\//g, "")
          .replace(/https:\/\//g, "")
          .replace(/\/+/g, " ")
          .replace(/\(/g, " ") // Replace opening parentheses with spaces
          .replace(/\)/g, " ") // Replace closing parentheses with spaces
          .replace(/\s+/g, " ") // Replace multiple spaces with a single space
          .replace(/compressed/g, "")
          .replace(/[]-,\.]+$/, "")
          
          .trim();
      };

      if (title) title = sanitizeTitle(title);

      // Fallback for invalid or short titles
      if (!title || title.length <= 5) {
        title = `${"Ministry of Youth Affairs and Sports"} document - ${counter++}`;
      }

      // Update the document in the database
      await collection.updateOne(
        { _id: doc._id },
        { $set: { title: title, tagString: tagstring} }
      );
      console.log(`Document with _id: ${doc._id} updated.`);
    }
  } catch (error) {
    console.error("Error updating documents:", error);
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

// Run the update function
updateDocs();