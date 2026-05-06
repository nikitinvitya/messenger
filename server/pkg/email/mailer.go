package email

import (
	"fmt"
	"net/smtp"
	"os"
)

type Mailer interface {
	SendVerificationEmail(to string, token string) error
}

type mailer struct {
	host     string
	port     string
	username string
	password string
	sender   string
}

func NewMailer() Mailer {
	return &mailer{
		host:     os.Getenv("SMTP_HOST"),
		port:     os.Getenv("SMTP_PORT"),
		username: os.Getenv("SMTP_USER"),
		password: os.Getenv("SMTP_PASSWORD"),
		sender:   os.Getenv("SMTP_SENDER"),
	}
}

func (m *mailer) SendVerificationEmail(to string, token string) error {
	appURL := os.Getenv("APP_URL")
	subject := "Subject: Messenger Email Verification\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"

	verificationURL := fmt.Sprintf("%s/api/v1/auth/verify?token=%s", appURL, token)

	body := fmt.Sprintf(`
		<html>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; display: flex; flex-direction: column; justify-content: center; align-items: center;">
				<h2>Welcome to Messenger!</h2>
				<p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
				<p><a href="%s" style="background: #2b5278; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify My Email</a></p>
				<p>If the button doesn't work, copy and paste this link: <br> %s</p>
				<p>This link will expire in 24 hours.</p>
			</body>
		</html>`, verificationURL, verificationURL)

	msg := []byte(subject + mime + body)
	auth := smtp.PlainAuth("", m.username, m.password, m.host)

	addr := fmt.Sprintf("%s:%s", m.host, m.port)
	return smtp.SendMail(addr, auth, m.sender, []string{to}, msg)
}
