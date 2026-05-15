package messagecrypto

import (
	"encoding/hex"
	"testing"
)

func TestEncryptDecrypt_roundTrip(t *testing.T) {
	keyBytes := make([]byte, keySize)
	keyBytes[0] = 0xab
	key := hex.EncodeToString(keyBytes)

	c, err := NewCipher(key)
	if err != nil {
		t.Fatalf("NewCipher: %v", err)
	}

	plaintext := "Привет, мир! 🔒"
	encoded, err := c.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Encrypt: %v", err)
	}
	if encoded == plaintext {
		t.Fatal("ciphertext must differ from plaintext")
	}

	decrypted, err := c.Decrypt(encoded)
	if err != nil {
		t.Fatalf("Decrypt: %v", err)
	}
	if decrypted != plaintext {
		t.Fatalf("got %q, want %q", decrypted, plaintext)
	}
}

func TestEncryptDecrypt_emptyString(t *testing.T) {
	key := hex.EncodeToString(make([]byte, keySize))

	c, err := NewCipher(key)
	if err != nil {
		t.Fatalf("NewCipher: %v", err)
	}

	encoded, err := c.Encrypt("")
	if err != nil {
		t.Fatalf("Encrypt: %v", err)
	}

	decrypted, err := c.Decrypt(encoded)
	if err != nil {
		t.Fatalf("Decrypt: %v", err)
	}
	if decrypted != "" {
		t.Fatalf("got %q, want empty string", decrypted)
	}
}

func TestNewCipher_invalidKey(t *testing.T) {
	if _, err := NewCipher("too-short"); err == nil {
		t.Fatal("expected error for invalid key")
	}
}
