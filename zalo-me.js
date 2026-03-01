const puppeteer = require('puppeteer');
const RoomSmileModel = require('./roomSmileModel');
const fn = require('./dboperations');
const ms = require('./functions/messages');
const { google } = require('googleapis');
const path = require("path");
const fs = require("fs");




async function sendMessageToGroup(page, groupName, headline, message) {
  message.push(headline);
  // Wait for the search input by its ID
  const searchInputSelector = '#contact-search-input';
  await page.waitForSelector(searchInputSelector, { timeout: 30000 });

  await page.type(searchInputSelector, groupName, { delay: 100 });

  // Wait a bit for search results to appear
   // --- Step 3: Wait for search results to appear ---
  await new Promise(resolve => setTimeout(resolve, 2000)); // small delay for UI to update

  // --- Step 5: Find the group in search results ---
  const groupItemsSelector = 'div[id^="group-item-"]';
  await page.waitForSelector(groupItemsSelector, { timeout: 10000 });

  const groups = await page.$$(groupItemsSelector);
  let targetGroup = null;

  for (const group of groups) {
    const nameHandle = await group.$('.conv-item-title__name');
    const nameText = await page.evaluate(el => el.innerText, nameHandle);

    if (nameText.includes(groupName)) {
      targetGroup = group;
      break;
    }
  }

  if (!targetGroup) {
    console.log('Group not found in search results');
    await browser.close();
    return;
  }

  // --- Step 6: Click the group to open chat ---
  await targetGroup.click();

  // --- Step 7: Wait for chat input container ---
  const chatInputContainerSelector = '#chat-input-container-id';
  await page.waitForSelector(chatInputContainerSelector, { timeout: 10000 });

  // --- Step 8: Activate rich input ---
  const richInput = await page.$('#richInput');
  await richInput.click(); // focus input

  await page.keyboard.type(message, { delay: 50 });
  await page.click('#richInput');
  await page.keyboard.press('Enter');
}


async function sendAttachmentToGroup(page, groupName, headline, destPath) {
  // message.push(headline);
  // Wait for the search input by its ID
  const searchInputSelector = '#contact-search-input';
  await page.waitForSelector(searchInputSelector, { timeout: 30000 });

  await page.type(searchInputSelector, groupName, { delay: 100 });

  // Wait a bit for search results to appear
   // --- Step 3: Wait for search results to appear ---
  await new Promise(resolve => setTimeout(resolve, 2000)); // small delay for UI to update

  // --- Step 5: Find the group in search results ---
  const groupItemsSelector = 'div[id^="group-item-"]';
  await page.waitForSelector(groupItemsSelector, { timeout: 10000 });

  const groups = await page.$$(groupItemsSelector);
  let targetGroup = null;

  for (const group of groups) {
    const nameHandle = await group.$('.conv-item-title__name');
    const nameText = await page.evaluate(el => el.innerText, nameHandle);

    if (nameText.includes(groupName)) {
      targetGroup = group;
      break;
    }
  }

  if (!targetGroup) {
    console.log('Group not found in search results');
    await browser.close();
    return;
  }

  // --- Step 6: Click the group to open chat ---
  await targetGroup.click();

  // --- Step 7: Wait for chat input container ---
  const chatInputContainerSelector = '#chat-input-container-id';
  await page.waitForSelector(chatInputContainerSelector, { timeout: 10000 });

  // --- Step 8: Attach file into the chat


   // 1️⃣ Create a temporary hidden file input
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'puppeteer-temp-input';
    input.style.display = 'none';
    document.body.appendChild(input);
  });

  const input = await page.$('#puppeteer-temp-input');

  // 2️⃣ Upload real file into input
  await input.uploadFile(destPath);

  // 4️⃣ Perform real drag & drop
  await page.evaluate((dropSelector) => {
    const input = document.querySelector('#puppeteer-temp-input');
    const dropTarget = document.querySelector(dropSelector);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(input.files[0]);

    dropTarget.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer }));
    dropTarget.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));
    dropTarget.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
  }, '#richInput');

  console.log('File dropped into chat!');

  const richInput = await page.$('#richInput');
  
  await richInput.click(); 

  await page.keyboard.type(headline, { delay: 50 });
  await page.click('#richInput');
  await page.keyboard.press('Enter');

}


// ---------------- Main script ----------------
(async () => {
  const destPath = await ms.downloadExcel();
  const occPeakRoomDate = await fn.getOccPeakRoomDate();
  const superDeluxePeakRoomDate = await fn.getSuperDeluxePeakRoomDate();
  const superDeluxeSaleRoomDate = await fn.getSuperDeluxeSaleRoomDate();

  let getOccPeakRoomDateMessage = await ms.procesOccPeakRoomDate(occPeakRoomDate);
  let getSuperDeluxePeakRoomDateMessage = await ms.procesSuperDeluxePeakRoomDate(superDeluxePeakRoomDate);
  let getSuperDeluxeSaleRoomDateMessage = await ms.procesSuperDeluxeSaleRoomDate(superDeluxeSaleRoomDate);

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './zalo-profile-bot', // 👈 session stored here
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto('https://chat.zalo.me', { waitUntil: 'networkidle2' });

  console.log('Zalo opened with saved session');

  const jobs = [
    {
      id: '1',
      group: 'OTA Laluna Hội An - Chiic',
      headline: '📢 Giá phòng Super Deluxe cân nhắc TĂNG giai đoạn cao điểm:\n\n',
      message: getSuperDeluxePeakRoomDateMessage
    },
    {
      id: '2',
      group: 'OTA Laluna Hội An - Chiic',
      headline: '📢 Công suất phòng giai đoạn tháng 4:\n\n',
      message: getOccPeakRoomDateMessage
    },
    {
      id: '3',
      group: 'OTA Laluna Hội An - Chiic',
      headline: '📢 Thống kê số phòng Super Deluxe đã bán giai đoạn tháng 4:\n\n',
      message: getSuperDeluxeSaleRoomDateMessage
    }
  ];

  const attachments = [
    {
      id: '1',
      group: 'OTA Laluna Hội An - Chiic',
      headline: '📢 Availability 12 Tháng:\n\n',
      path: destPath
    }
  ];

  for (const job of jobs) {
    if (job.message.length > 0) {
      await sendMessageToGroup(
        page,
        job.group,
        job.headline,
        job.message
      );
    }
    
  }

  for (const attachment of attachments) {
    await sendAttachmentToGroup(
      page,
      attachment.group,
      attachment.headline,
      attachment.path
    );
  }

  // optional: close browser
  // await browser.close();
})();