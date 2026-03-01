require('dotenv').config(); 
const fn = require('../dboperations');
const { google } = require('googleapis');
const path = require("path");
const fs = require("fs");


const generateShortId = function(length = 3) {
  // Use a higher radix (base 36) to get both numbers (0-9) and letters (a-z)
  return Math.random().toString(36).substring(2, length + 2);
};

async function getDrive() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

async function getLatestFileInFolder(drive) {
  const res = await drive.files.list({
    q: "'10toEGWjQwL0tUou4rJ0AWtWd-63L-kqz' in parents",
    orderBy: "createdTime desc",
    pageSize: 1,
    fields: "files(id, name, createdTime)",
  });

  if (!res.data.files.length) {
    throw new Error("No spreadsheet found in folder.");
  }

  return res.data.files[0];
}

async function downloadExcel() {
  const drive = await getDrive();

  const latestFile = await getLatestFileInFolder(drive);

  console.log("Latest file found:", latestFile.name, latestFile.mimeType);

  const parsed = path.parse(latestFile.name);

  const uniqueName = `${parsed.name}_${generateShortId()}${parsed.ext}`;

  const destPath = path.resolve(
    __dirname,
    "../assets",
    uniqueName
  );

  // Download the Excel file directly
  const res = await drive.files.get(
    { fileId: latestFile.id, alt: "media" },
    { responseType: "stream" }
  );

  await new Promise((resolve, reject) => {
    res.data
      .pipe(fs.createWriteStream(destPath))
      .on("finish", resolve)
      .on("error", reject);
  });

  console.log("Downloaded Excel file to:", destPath);
  return destPath;
}

async function procesSuperDeluxeSaleRoomDate(data) {
  const processedData = data[0];
  let returnMessage = [];
  processedData.forEach(element => {
    returnMessage.unshift(`-Ngày: ${element.Date} | Đã Bán: ${element.Count} | Max Price: ${element['Max Price']} VND\n`);
  });
  return returnMessage;
}

async function procesSuperDeluxePeakRoomDate(data) {
  const processedData = data[0];
  let returnMessage = [];
  processedData.forEach(element => {
    returnMessage.unshift(`-Ngày: ${element.Date} | Đã Bán: ${element.Count} | Max Price: ${element['Max Price']} VND\n`);
  });
  return returnMessage;
}

async function procesOccPeakRoomDate(data) {
  const processedData = data[0];
  let returnMessage = [];
  processedData.forEach(element => {
    returnMessage.unshift(`-Ngày: ${element.Date} || ${element.Occ}%\n`);
  });
  return returnMessage;
}

module.exports = {
  procesOccPeakRoomDate: procesOccPeakRoomDate,
  procesSuperDeluxePeakRoomDate: procesSuperDeluxePeakRoomDate,
  procesSuperDeluxeSaleRoomDate: procesSuperDeluxeSaleRoomDate,
  downloadExcel: downloadExcel
}