// query to get id and title

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");





async function transferData() {
  // const sourceUri = "mongodb://127.0.0.1:27017/sc2";
  // const sourceUri = "mongodb://localhost:27017/scrapping_testing";
  // const sourceUri = "mongodb://localhost:27017/scrapping_correction_dares";
  // const sourceUri = "mongodb://localhost:27017/scrapping_correction_dolrs";
  // const sourceUri = "mongodb://localhost:27017/scrapping_testing_pharmaceuticals";
  // const sourceUri = "mongodb://localhost:27017/scrapping_testing_powermins";
  // const sourceUri = "mongodb://localhost:27017/scrapping_mohuas";
  // const sourceUri = "mongodb://localhost:27017/scrapping_yas";
  // const sourceUri = "mongodb://localhost:27017/scrapping_mohuas";
  const sourceUri = "mongodb://localhost:27017/scrap_yas";
  // const sourceUri =
  //   "mongodb+srv://deepakkumar:M92xjniipmDT8rtK@cluster0.z2d9d.mongodb.net/centersect?retryWrites=true&w=majority&appName=Cluster0";

  const sourceClient = new MongoClient(sourceUri);
  // const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    // await targetClient.connect();

    const sourceDb = sourceClient.db();
    // const targetDb = targetClient.db();

    const collections = await sourceDb.listCollections().toArray();

    for (const collection of collections) {
      const data = await sourceDb
        .collection(collection.name)
        .find({}, { projection: { _id: 1, title: 1, pdfUrls: 1, tagString: 1 } })
        // .find({}, { projection: { title: 1 } }) // Only retrieve title
        .toArray();

      // Extract titles from the retrieved data
      const titles = data.map((doc) => doc.title);
      const pdfUrls = data.map((doc) => doc.pdfUrls);
      const tagStrings = data.map((doc) => doc.tagString);

      // Define the file path for JSON output
      // const folderPath = path.join(__dirname, "ccis");
      // const folderPath = path.join(__dirname, "dares");
      // const folderPath = path.join(__dirname, "dolrs");
      // const folderPath = path.join(__dirname, "mohuas");
      // const folderPath = path.join(__dirname, "pharmaceuticals");
      // const folderPath = path.join(__dirname, "powermins");
      const folderPath = path.join(__dirname, "yas");
      // const folderPath = path.join(__dirname, "ccis");



      

      const titlesFilePath = path.join(
        folderPath,
        `${collection.name}-titles.json`
      );
      const urlsFilePath = path.join(
        folderPath,
        `${collection.name}-pdfUrls.json`
      );
      const tagFilePath = path.join(
        folderPath,
        `${collection.name}-tagString.json`
      );

      // Create the folder if it doesn't exist
      fs.mkdirSync(folderPath, { recursive: true });
      // 
      // Write data to JSON file
      fs.writeFileSync(titlesFilePath, JSON.stringify(titles, null, 2));
      fs.writeFileSync(urlsFilePath, JSON.stringify(pdfUrls, null, 2));
      fs.writeFileSync(tagFilePath, JSON.stringify(tagStrings, null, 2));

      console.log(`Saved ${titles.length} documents from ${collection.name}`);
    }
  } finally {
    await sourceClient.close();
    // await targetClient.close();
  }
}

transferData().catch(console.error);
