# Contact form → Google Sheet (Excel) setup

The contact form now sends every submission as a new row in a Google Sheet,
which you can open or export to Excel anytime. Follow these one-time steps.

## 1. Create the Google Sheet
1. Go to https://sheets.google.com and create a new blank spreadsheet.
2. Name it e.g. `Portfolio Contacts`.
3. In **row 1**, add these column headers (exactly, in this order):

   | A          | B    | C     | D     | E       |
   |------------|------|-------|-------|---------|
   | Timestamp  | Name | Email | Phone | Message |

## 2. Add the Apps Script
1. In the sheet, click **Extensions → Apps Script**.
2. Delete any sample code and paste the code below.
3. Click the **Save** (disk) icon.

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([
    new Date(),
    e.parameter.name || "",
    e.parameter.email || "",
    e.parameter.phone || "",
    e.parameter.message || ""
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Deploy as a Web App
1. Click **Deploy → New deployment**.
2. Click the gear icon → choose **Web app**.
3. Set:
   - **Description:** anything (e.g. `contact form`)
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**, then **Authorize access** and allow the permissions.
5. Copy the **Web app URL** (it looks like
   `https://script.google.com/macros/s/AKfy.../exec`).

## 4. Paste the URL into the site
1. Open `index.js`.
2. Find this line near the contact-form section:

   ```javascript
   const SHEET_ENDPOINT = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
   ```
3. Replace the placeholder with the Web app URL you copied.
4. Save, and re-deploy/refresh the site.

## Done
Now each time someone fills the form and clicks **Send**, a new row with
Timestamp, Name, Email, Phone and Message appears in your Google Sheet.
To get an Excel file: in the sheet, use **File → Download → Microsoft Excel (.xlsx)**.

> Tip: To also get an email alert on every submission, add this line inside
> `doPost`, after `sheet.appendRow([...]);`:
> ```javascript
> MailApp.sendEmail("paras77295@gmail.com", "New portfolio contact",
>   e.parameter.name + " (" + e.parameter.email + ")\n" + e.parameter.message);
> ```
