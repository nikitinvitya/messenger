package messagecrypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"strings"
)

const keySize = 32

var (
	ErrInvalidKey         = errors.New("encryption key must be 32 bytes")
	ErrCiphertextTooShort = errors.New("ciphertext is too short")
)

type Cipher struct {
	aead cipher.AEAD
}

func NewCipher(keyMaterial string) (*Cipher, error) {
	key, err := decodeKey(keyMaterial)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("create aes cipher: %w", err)
	}

	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create gcm: %w", err)
	}

	return &Cipher{aead: aead}, nil
}

func decodeKey(keyMaterial string) ([]byte, error) {
	keyMaterial = strings.TrimSpace(keyMaterial)
	if keyMaterial == "" {
		return nil, ErrInvalidKey
	}

	if key, err := hex.DecodeString(keyMaterial); err == nil {
		if len(key) == keySize {
			return key, nil
		}
	}

	key, err := base64.StdEncoding.DecodeString(keyMaterial)
	if err != nil {
		return nil, fmt.Errorf("%w: use 64-char hex or base64-encoded 32 bytes", ErrInvalidKey)
	}
	if len(key) != keySize {
		return nil, ErrInvalidKey
	}

	return key, nil
}

func (c *Cipher) Encrypt(plaintext string) (string, error) {
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}

	ciphertext := c.aead.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (c *Cipher) Decrypt(encoded string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", fmt.Errorf("decode ciphertext: %w", err)
	}

	nonceSize := c.aead.NonceSize()
	if len(data) < nonceSize {
		return "", ErrCiphertextTooShort
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := c.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("decrypt message: %w", err)
	}

	return string(plaintext), nil
}
