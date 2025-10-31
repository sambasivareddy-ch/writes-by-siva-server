import { 
    scryptSync, 
    randomBytes, 
    createCipheriv, 
    createDecipheriv, 
    createHash 
} from "crypto";

const ENC_ALGO = "aes-256-gcm";
const ENC_KEY = scryptSync("re_a4JWRmHi_GsvpsgrT8AiPgMBvYpriN2C1", "salt", 32);
const ENC_IV_LEN = 16;

const encryptEmail = (email) => {
    const iv = randomBytes(ENC_IV_LEN);
    const cipher = createCipheriv(ENC_ALGO, ENC_KEY, iv);

    let encrypted = cipher.update(email, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");

    return {
        encrypted,
        iv: iv.toString("hex"),
        tag,
    };
}

const decryptEmail = ({ encrypted, iv, tag }) => {
    const decipher = createDecipheriv(
        ENC_ALGO,
        ENC_KEY,
        Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

const hashEmail = (email) => {
    return createHash("sha256").update(email).digest('hex');
}

export {
    encryptEmail,
    decryptEmail,
    hashEmail
}