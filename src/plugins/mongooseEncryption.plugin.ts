// import { Schema, Query } from "mongoose";
// import { encryptText, decryptText } from "../security/encryption";

// export const mongooseEncryptionPlugin = (schema: Schema) => {

//     const encryptedFields: string[] = [];

//     /* ---------- Detect encrypted fields ---------- */

//     schema.eachPath((pathname, schemaType: any) => {
//         if (schemaType.options?.encrypt === true) {
//             encryptedFields.push(pathname);
//         }
//     });

//     /* ---------- Encrypt before save ---------- */

//     schema.pre("save", async function () {

//         const doc: any = this;

//         for (const field of encryptedFields) {

//             const value = doc.get(field);

//             if (value && typeof value === "string") {
//                 doc.set(field, await encryptText(value));
//             }

//         }

//     });

//     /* ---------- Encrypt before update ---------- */

//     schema.pre("findOneAndUpdate", async function (this: Query<any, any>) {

//         const update: any = this.getUpdate();

//         if (!update) return;

//         if (update.$set) {

//             for (const field of encryptedFields) {

//                 if (update.$set[field] && typeof update.$set[field] === "string") {
//                     update.$set[field] = await encryptText(update.$set[field]);
//                 }

//             }

//         }

//     });

//     /* ---------- Decrypt Helper ---------- */

//     const decryptDoc = async (doc: any) => {

//         if (!doc) return;

//         for (const field of encryptedFields) {

//             const value = doc.get(field);

//             if (value?.iv) {
//                 doc.set(field, await decryptText(value));
//             }

//         }

//     };

//     /* ---------- Decrypt after query ---------- */

//     schema.post("findOne", async function (doc: any) {
//         await decryptDoc(doc);
//     });

//     schema.post("find", async function (docs: any[]) {

//         if (!docs) return;

//         for (const doc of docs) {
//             await decryptDoc(doc);
//         }

//     });

// };