import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [operation, source, destination] = process.argv.slice(2);
const secret = process.env.RELEASE_ARTIFACT_KEY ?? '';

if (!/^[0-9a-f]{64}$/i.test(secret)) {
  throw new Error(
    'RELEASE_ARTIFACT_KEY must contain 32 random bytes encoded as hex.',
  );
}

if (operation !== 'check') {
  const context = process.env.RELEASE_ARTIFACT_CONTEXT;
  if (!context || !source || !destination) {
    throw new Error(
      'The release artifact context and both file paths are required.',
    );
  }

  const key = Buffer.from(secret, 'hex');
  const associatedData = Buffer.from(context);
  const input = await readFile(source);
  const nonceLength = 12;
  const tagLength = 16;
  const options = { flag: 'wx', mode: 0o600 };

  if (operation === 'encrypt') {
    const nonce = randomBytes(nonceLength);
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    cipher.setAAD(associatedData);
    const ciphertext = Buffer.concat([cipher.update(input), cipher.final()]);
    await writeFile(
      destination,
      Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]),
      options,
    );
  } else if (operation === 'decrypt') {
    if (input.length <= nonceLength + tagLength) {
      throw new Error('The encrypted release artifact is truncated.');
    }

    const nonce = input.subarray(0, nonceLength);
    const tag = input.subarray(nonceLength, nonceLength + tagLength);
    const ciphertext = input.subarray(nonceLength + tagLength);
    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAAD(associatedData);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    await writeFile(destination, plaintext, options);
  } else {
    throw new Error('Expected check, encrypt or decrypt.');
  }
}
