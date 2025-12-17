import pdfplumber

async def extract_resume_text(file):
    text = ""
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text.strip()
