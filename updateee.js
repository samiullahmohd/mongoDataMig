// Example Usage:
const titles = [
  "03.10.2013,",
  "04.03.2024.",
  "18.11.2022",
  "Scan0009 1",
  "Circular",
  "Click Here",
  "More Information",
  "Dummy (1)",
  "Doc1 26",
  "annexure",
  "Scan0009",
  "Scan0009 1",
  "Scan0009 2",
  "Scan0009 3",
  "Scan0009 4",
];

const tagString = "Category <-> Subcategory <-> Tag";


titles.forEach((title)=>{
    console.log(`current title:${title}`);
    
    const updatedTitle = updateTitle(title,tagString);
   
})
function updateTitle(title, tagString) {
  // Check if the title matches specific patterns or is a numeric value
  let isNum = Number(title);
  
  
  if (
    /^(photos|img|order|docs|details|subject|aaaaaa|click here|circular|annexure|scan|dummy|file|doc|more information)/i.test(
      title
    ) ||
    !isNaN(isNum) ||
    /^\d{2}\.\d{2}\.\d{4}[.,]?$/.test(title) || // Matches date formats like "03.10.2013," or "04.03.2024."
    /^\(.*\)$/.test(title) || // Matches patterns like "(1)"
    /^\d+\s*\d*$/.test(title) // Matches patterns like "5963151733 0 0"
  ) {
    //Review
    const tagSegments = tagString.split(" <-> ");
    title =
      tagSegments[tagSegments.length - 1] + Math.floor(Math.random() * 21) ||
      title;
      
    
    console.log(`Updated title to: ${title}`);
  }
 
}

