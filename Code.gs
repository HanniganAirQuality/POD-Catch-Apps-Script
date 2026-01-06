function test() {
  var e = {
    parameter: {
      event: 'LPODD0',
      data: '[1,1234]',
      coreid: '1f0030001647ffffffffffff',
      published_at: new Date().toISOString()
    },
    postData: {
      contents: "event=LPODD0&data=%5B1%2C1234%5D&coreid=1f0030001647ffffffffffff&published_at=" + encodeURIComponent(new Date().toISOString())
    }
  };
  doPost(e);
}
function doPost(e) {
  Logger.log("Received parameters: " + JSON.stringify(e.parameter));
  Logger.log("Raw POST data: " + e.postData.contents);

  var dataRaw = e.parameter.data;
  var dataArrays;

  // Try parsing the data as JSON
  try {
    dataArrays = JSON.parse(dataRaw);

    if (!Array.isArray(dataArrays)) {
      Logger.log("Parsed data is not an array. Wrapping in an array.");
      dataArrays = [dataRaw]; // Wrap raw string in an array
    }
  } catch (err) {
    Logger.log("Failed to parse 'data' as JSON. Treating as a string.");
    dataArrays = [dataRaw]; // Use the raw string in an array
  }

  Logger.log("Processed data: " + JSON.stringify(dataArrays));

  // Append to the sheet
  var sheet = SpreadsheetApp.getActiveSheet();
  dataArrays.forEach(function(dataArray) {
    var row = [e.parameter.coreid, new Date(e.parameter.published_at)].concat(dataArray);
    sheet.appendRow(row);
  });

  Logger.log("Rows appended successfully.");

  checkSheetCapacity();

  var result = {};
  result.ok = true;

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);

}

function checkSheetCapacity() {
  var threshold = 1500;  // Adjust this to your desired row limit
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rowCount = sheet.getLastRow();
  
  if (rowCount >= threshold) {
    sendSpreadsheetAsCSV();
    clearSpreadsheet();
  }
}

function sendSpreadsheetAsCSV() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getActiveSheet();
    
    // Get the data as CSV
    var csvData = convertSheetToCSV(sheet);
    // var dateTime = Utilities.formatDate(new Date(), "yyyy-MM-dd");
    var fileName = sheet.getName() + ".csv";
    
    // Create a file blob from the CSV data
    var fileBlob = Utilities.newBlob(csvData, "text/csv", fileName);
    
    // Send the file via email
    var email = "simivalleylpod@gmail.com"; // Replace with your email
    var subject = "LPODD0 Spreadsheet Capacity Alert - Data Exported";
    var message = "Your spreadsheet has reached its capacity, and the data has been exported to a CSV file.";
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: message,
      attachments: [fileBlob]
    });
    
    Logger.log("Email sent successfully with CSV attachment to " + email);
  } catch (error) {
    Logger.log("Failed to send email: " + error.message);
  }
}

function convertSheetToCSV(sheet) {
  var data = sheet.getDataRange().getValues();
  var csv = "";
  
  data.forEach(function(rowArray) {
    var row = rowArray.map(function(value) {
      return (typeof value === 'string') ? '"' + value.replace(/"/g, '""') + '"' : value;
    }).join(",");
    csv += row + "\n";
  });
  
  return csv;
}

function clearSpreadsheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Clear all the data in the spreadsheet
  sheet.clear();
}
