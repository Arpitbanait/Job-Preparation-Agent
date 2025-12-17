from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import base64
import os


SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

def get_gmail_service():
    creds = None

    # If token exists use it
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    # If no valid token → login with browser & generate new token.json
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
        creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)



def send_gmail(to_email: str, subject: str, message: str):
    """Send a simple text email via Gmail API (no attachments)."""
    service = get_gmail_service()

    msg = MIMEText(message)
    msg["to"] = to_email
    msg["subject"] = subject

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    result = service.users().messages().send(
        userId="me",
        body={"raw": raw}
    ).execute()

    return {"message": "Email sent successfully!", "id": result.get("id")}


def send_gmail_with_attachment(to_email: str, subject: str, message: str, attachment_path: str, attachment_filename: str = None):
    """Send an email with a single attachment via Gmail API.

    attachment_path: absolute or relative path to file on disk
    attachment_filename: override the filename shown to the recipient
    """
    service = get_gmail_service()

    mime = MIMEMultipart()
    mime["to"] = to_email
    mime["subject"] = subject
    mime.attach(MIMEText(message, "plain"))

    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        filename = attachment_filename or os.path.basename(attachment_path)
        part.add_header("Content-Disposition", f"attachment; filename={filename}")
        mime.attach(part)

    raw = base64.urlsafe_b64encode(mime.as_bytes()).decode()
    result = service.users().messages().send(userId="me", body={"raw": raw}).execute()
    return {"message": "Email sent successfully!", "id": result.get("id")}
