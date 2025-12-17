import fitz  # PyMuPDF

def extract_text_from_pdf(path):
    doc = fitz.open(path)              # ← now works
    text = ""

    for page in doc:
        text += page.get_text()

    return text
