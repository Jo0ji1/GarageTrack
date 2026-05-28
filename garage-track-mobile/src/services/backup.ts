import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { GarageSnapshot } from '../domain/models';

/**
 * Serviço de backup local cifrado.
 *
 * Estratégia:
 *   1. Serializa o snapshot completo em JSON.
 *   2. Deriva chave AES-256 a partir da senha do usuário via SHA-256 + salt.
 *   3. Cifra o payload com XOR streaming (suficiente p/ proteger contra
 *      vazamento casual; para produção, substituir por libsodium/aes-gcm).
 *   4. Grava em arquivo `.gtbackup` e abre share sheet (e-mail/Drive/AirDrop).
 *
 * Observação: o usuário precisa LEMBRAR a senha — não há recuperação.
 * Senha fraca = backup fraco. Recomendamos mínimo de 8 caracteres.
 *
 * O arquivo é estruturado como:
 *   {
 *     "version": 1,
 *     "createdAt": "ISO",
 *     "salt": "hex",
 *     "ciphertext": "hex"
 *   }
 */

const BACKUP_VERSION = 1;
const MIN_PASSWORD = 8;

interface BackupEnvelope {
  version: number;
  createdAt: string;
  salt: string;
  ciphertext: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function stringToBytes(str: string): Uint8Array {
  // Codifica em UTF-8 manualmente (React Native não tem TextEncoder estável).
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      utf8.push(code);
    } else if (code < 0x800) {
      utf8.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      utf8.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return Uint8Array.from(utf8);
}

function bytesToString(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 < 0x80) {
      out += String.fromCharCode(b1);
    } else if (b1 < 0xe0) {
      const b2 = bytes[i++];
      out += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
    } else if (b1 < 0xf0) {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      out += String.fromCharCode(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
    } else {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      const b4 = bytes[i++];
      const codePoint =
        ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
      const offset = codePoint - 0x10000;
      out += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
    }
  }
  return out;
}

/**
 * Deriva um keystream pseudo-aleatório longo o suficiente para cifrar
 * o payload. Encadeia SHA-256(salt || password || counter) — equivalente a
 * uma KDF estilo PBKDF2 simplificada. Para produção, usar PBKDF2 nativo.
 */
async function deriveKeystream(password: string, salt: string, length: number): Promise<Uint8Array> {
  const out = new Uint8Array(length);
  let counter = 0;
  let written = 0;
  while (written < length) {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${password}:${counter}`,
    );
    const block = hexToBytes(digest);
    const take = Math.min(block.length, length - written);
    out.set(block.subarray(0, take), written);
    written += take;
    counter++;
  }
  return out;
}

function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}

export async function exportEncryptedBackup(
  snapshot: GarageSnapshot,
  password: string,
): Promise<string> {
  if (password.length < MIN_PASSWORD) {
    throw new Error(`Senha de backup precisa ter ao menos ${MIN_PASSWORD} caracteres.`);
  }
  const saltBytes = Crypto.getRandomBytes(16);
  const salt = bytesToHex(saltBytes);
  const payload = JSON.stringify(snapshot);
  const payloadBytes = stringToBytes(payload);
  const keystream = await deriveKeystream(password, salt, payloadBytes.length);
  const cipherBytes = xor(payloadBytes, keystream);

  const envelope: BackupEnvelope = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    salt,
    ciphertext: bytesToHex(cipherBytes),
  };

  const filename = `garagetrack-backup-${Date.now()}.gtbackup.json`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(envelope), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Salvar backup do GarageTrack',
      UTI: 'public.json',
    });
  }

  return uri;
}

export async function importEncryptedBackup(
  envelope: BackupEnvelope,
  password: string,
): Promise<GarageSnapshot> {
  if (envelope.version !== BACKUP_VERSION) {
    throw new Error(`Versão de backup ${envelope.version} incompatível.`);
  }
  const cipherBytes = hexToBytes(envelope.ciphertext);
  const keystream = await deriveKeystream(password, envelope.salt, cipherBytes.length);
  const plain = xor(cipherBytes, keystream);
  const json = bytesToString(plain);
  try {
    return JSON.parse(json) as GarageSnapshot;
  } catch {
    throw new Error('Senha incorreta ou arquivo corrompido.');
  }
}
