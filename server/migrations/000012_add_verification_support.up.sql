ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE verification_tokens (
                                     id SERIAL PRIMARY KEY,
                                     user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                     token TEXT NOT NULL UNIQUE,
                                     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                                     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);