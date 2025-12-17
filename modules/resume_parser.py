import pdfplumber

def extract_resume_text(file_bytes: bytes) -> str:
    """
    Extract text from PDF bytes uploaded by user.
    """

    try:
        with pdfplumber.open(BytesReader(file_bytes)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            return text.strip()
    except Exception:
        return file_bytes.decode(errors="ignore")[:5000]  # Fallback to raw decode


class BytesReader:
    """Allows pdfplumber to read bytes like a file object"""
    def __init__(self, data: bytes):
        self.data = data
        self.ptr = 0

    def read(self, size=-1):
        if size == -1:
            size = len(self.data) - self.ptr
        chunk = self.data[self.ptr:self.ptr+size]
        self.ptr += size
        return chunk

    def seek(self, pos):
        self.ptr = pos

    def tell(self):
        return self.ptr

    def close(self):
        pass
