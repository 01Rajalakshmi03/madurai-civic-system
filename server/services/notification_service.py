import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
from models.user import Notification, User

load_dotenv()

class NotificationService:
    def __init__(self):
        self.mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        self.mail_port = int(os.getenv('MAIL_PORT', 587))
        self.mail_use_tls = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
        self.mail_username = os.getenv('MAIL_USERNAME')
        self.mail_password = os.getenv('MAIL_PASSWORD')
        self.mail_default_sender = os.getenv('MAIL_DEFAULT_SENDER')

    def send_email(self, to_email, subject, body):
        if not self.mail_username or not self.mail_password:
            print(f"Email not configured. Would send: {subject} to {to_email}")
            return False

        try:
            msg = MIMEMultipart()
            msg['From'] = self.mail_default_sender
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(self.mail_server, self.mail_port)
            if self.mail_use_tls:
                server.starttls()
            server.login(self.mail_username, self.mail_password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"Email sending error: {e}")
            return False

    def send_complaint_email(self, user_email, user_name, complaint_id, status, title):
        subject = f"Complaint #{complaint_id} Status Update: {status}"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Madurai Smart City - Complaint Update</h2>
            <p>Dear {user_name},</p>
            <p>Your complaint <strong>#{complaint_id}</strong> regarding <strong>{title}</strong> has been updated.</p>
            <p><strong>Current Status:</strong> {status}</p>
            <p>Track your complaint: <a href="http://localhost:3000/track/{complaint_id}">Click here</a></p>
            <br>
            <p>Thank you,<br>Madurai Smart City Team</p>
        </body>
        </html>
        """
        return self.send_email(user_email, subject, body)

    def create_notification(self, user_id, title, message, notif_type='system'):
        try:
            user = User.objects(id=user_id).first()
            if not user:
                return None

            notification = Notification(
                user=user,
                title=title,
                message=message,
                type=notif_type
            ).save()
            return notification
        except Exception as e:
            print(f"Notification creation error: {e}")
            return None

    def notify_complaint_update(self, user_id, complaint_id, status, title):
        status_labels = {
            'filed': 'Filed',
            'assigned': 'Assigned',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'rejected': 'Rejected'
        }
        label = status_labels.get(status, status)
        return self.create_notification(
            user_id,
            f"Complaint #{complaint_id} Updated",
            f"Your complaint '{title}' is now {label}.",
            'complaint_update'
        )

    def notify_assignment(self, officer_id, complaint_id, title):
        return self.create_notification(
            officer_id,
            "New Complaint Assignment",
            f"You have been assigned complaint #{complaint_id}: {title}.",
            'assignment'
        )

notification_service = NotificationService()
