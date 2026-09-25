// An Appwrite document id derived from a key (FNV-1a 64-bit), so two concurrent writers for the
// same key collide on one id instead of creating duplicate rows. Always a valid Appwrite id:
// the prefix, an underscore, and 16 hex digits.
export const documentIdFor = (prefix: string, key: string) => {
    let hash = 0xcbf29ce484222325n;
    for (const byte of new TextEncoder().encode(key)) {
        hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
    }
    return `${prefix}_${hash.toString(16).padStart(16, "0")}`;
};
