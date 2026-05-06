---
name: document-reader
description: Read, extract, and summarize content from PDF, Word (.docx), Excel (.xlsx/.xls), PowerPoint (.pptx), and Microsoft 365 Office files. Use when a user shares or asks about any of these file types and wants the content read, summarized, extracted, analyzed, or converted to text. Triggers on phrases like "read this file", "what does this document say", "open this PDF", "summarize this Word doc", "read this Excel", "what's in this PowerPoint", "extract data from", or any request involving .pdf, .docx, .doc, .xlsx, .xls, .pptx, .ppt files.
---

# Document Reader

Read and extract content from PDF, Word, Excel, PowerPoint, and Microsoft 365 Office files.

## Required Libraries

Install with pip if not already available:

```bash
pip install pymupdf python-docx openpyxl python-pptx pdfplumber xlrd
```

## Quick Reference by File Type

### PDF (.pdf)

```python
import fitz  # pymupdf

doc = fitz.open("file.pdf")
for page in doc:
    print(page.get_text())
doc.close()
```

For tables/structured data in PDFs, use pdfplumber:

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    for page in pdf.pages:
        print(page.extract_text())
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                print(row)
```

### Word (.docx / .doc)

```python
from docx import Document

doc = Document("file.docx")
for para in doc.paragraphs:
    print(para.text)

# Tables
for table in doc.tables:
    for row in table.rows:
        for cell in row.cells:
            print(cell.text, end="\t")
        print()
```

> Note: `.doc` (old format) must be converted first. Use LibreOffice or ask the user to save as `.docx`.

### Excel (.xlsx / .xls)

```python
import openpyxl

wb = openpyxl.load_workbook("file.xlsx")
for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    print(f"--- Sheet: {sheet_name} ---")
    for row in ws.iter_rows(values_only=True):
        print(row)
```

For `.xls` (old format):

```python
import xlrd

wb = xlrd.open_workbook("file.xls")
for sheet in wb.sheets():
    for row in range(sheet.nrows):
        print(sheet.row_values(row))
```

### PowerPoint (.pptx / .ppt)

```python
from pptx import Presentation

prs = Presentation("file.pptx")
for i, slide in enumerate(prs.slides):
    print(f"--- Slide {i+1} ---")
    for shape in slide.shapes:
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                print(para.text)
```

> Note: `.ppt` (old format) must be converted to `.pptx` first.

## Workflow

1. **Identify file type** from extension or user description
2. **Check if library is available** — install if missing
3. **Extract content** using the appropriate method above
4. **Summarize or present** the content clearly to the user
5. **Flag issues**: password-protected files, corrupted files, or unsupported old formats (.doc, .ppt, .xls) that need conversion

## Microsoft 365 (Cloud Files)

If the user refers to files stored in OneDrive, SharePoint, or Teams:
- Ask them to **download the file locally** and share it, OR
- Ask them to **copy/paste the content** directly into chat
- Direct cloud M365 API integration requires OAuth credentials — flag this if needed and ask Fellito for setup

## Tips

- Always confirm the number of pages/slides/sheets found before summarizing
- For large Excel files, ask the user which sheet(s) to focus on
- For long PDFs, ask which sections matter or summarize by page range
- If a file is password-protected, ask the user for the password
- Preserve table structure when presenting extracted data (use plain text formatting for WhatsApp)
