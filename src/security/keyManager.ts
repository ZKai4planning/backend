import fs from "fs";
import path from "path";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { JWT_CONFIG } from "../config/jwt.config";

interface KeyRegistry {
  current_kid: string | null;
  keys: Record<string, { created_at: string }>;
}

export class KeyManager {
  private keyDir: string;
  private registryPath: string;
  private registry: KeyRegistry;

  constructor() {
    this.keyDir = path.resolve(JWT_CONFIG.KEY_DIR);

    if (!fs.existsSync(this.keyDir)) {
      fs.mkdirSync(this.keyDir, { recursive: true });
    }

    this.registryPath = path.join(this.keyDir, "key_registry.json");
    this.registry = this.loadRegistry();

    if (!Object.keys(this.registry.keys).length) {
      this.generateNewKeypair();
    }
  }

  private loadRegistry(): KeyRegistry {
    if (fs.existsSync(this.registryPath)) {
      return JSON.parse(fs.readFileSync(this.registryPath, "utf8"));
    }

    return {
      current_kid: null,
      keys: {}
    };
  }

  private saveRegistry() {
    fs.writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2));
  }

  private generateNewKeypair(): string {
    const kid = uuidv4();

    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem"
      }
    });

    const privPath = path.join(this.keyDir, `private_key_${kid}.pem`);
    const pubPath = path.join(this.keyDir, `public_key_${kid}.pem`);

    fs.writeFileSync(privPath, privateKey);
    fs.writeFileSync(pubPath, publicKey);

    this.registry.keys[kid] = {
      created_at: new Date().toISOString()
    };

    this.registry.current_kid = kid;

    this.saveRegistry();

    // Print info to console
    console.log("\n🔐 New RSA keypair generated");
    console.log(`📁 Key directory: ${this.keyDir}`);

    return kid;
  }

  getCurrentPrivateKey(): { key: string; kid: string } {
    const kid = this.registry.current_kid!;
    const key = fs.readFileSync(
      path.join(this.keyDir, `private_key_${kid}.pem`),
      "utf8"
    );

    return { key, kid };
  }

  getPublicKey(kid: string): string | null {
    const file = path.join(this.keyDir, `public_key_${kid}.pem`);

    if (!fs.existsSync(file)) return null;

    return fs.readFileSync(file, "utf8");
  }

  getAllPublicKeys(): Record<string, string> {
    const result: Record<string, string> = {};

    for (const kid of Object.keys(this.registry.keys)) {
      const key = this.getPublicKey(kid);
      if (key) result[kid] = key;
    }

    return result;
  }

  rotateKeysIfNeeded() {
    const currentKid = this.registry.current_kid!;
    const created = new Date(this.registry.keys[currentKid].created_at);

    const ageDays =
      (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays >= JWT_CONFIG.KEY_REFRESH_DAYS) {
      console.log("Rotating RSA keys...");
      this.generateNewKeypair();
      this.pruneOldKeys();
    }
  }

  private pruneOldKeys() {
    const safeLifetime =
      JWT_CONFIG.KEY_REFRESH_DAYS + JWT_CONFIG.TOKEN_TTL_DAYS;

    const now = Date.now();

    for (const kid of Object.keys(this.registry.keys)) {
      if (kid === this.registry.current_kid) continue;

      const created = new Date(
        this.registry.keys[kid].created_at
      ).getTime();

      const age =
        (now - created) / (1000 * 60 * 60 * 24);

      if (age > safeLifetime) {
        console.log(`Deleting old key ${kid}`);

        fs.rmSync(path.join(this.keyDir, `private_key_${kid}.pem`), {
          force: true
        });

        fs.rmSync(path.join(this.keyDir, `public_key_${kid}.pem`), {
          force: true
        });

        delete this.registry.keys[kid];
      }
    }

    this.saveRegistry();
  }

  getJWKS() {
    const jwks = { keys: [] as any[] };

    for (const [kid, pem] of Object.entries(this.getAllPublicKeys())) {
      const key = crypto.createPublicKey(pem).export({
        format: "jwk"
      }) as any;

      jwks.keys.push({
        kty: key.kty,
        n: key.n,
        e: key.e,
        alg: "RS256",
        use: "sig",
        kid
      });
    }

    return jwks;
  }
}

export const keyManager = new KeyManager();