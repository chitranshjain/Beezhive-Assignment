const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Filter = require("bad-words");
const list = require("badwords-list");
const capitalize = require("capitalize");

admin.initializeApp();

var filter = new Filter();
const words = list.array;
filter.addWords(...words);

exports.addMessage = functions.https.onRequest(async (req, res) => {
  const original = req.query.text;
  const writeResult = await admin
    .firestore()
    .collection("messages")
    .add({ text: original });
  res.json({ result: `Message with ID: ${writeResult.id} added.` });
});

exports.moderate = functions.firestore
  .document("/messages/{documentId}")
  .onCreate((snap, context) => {
    const originalText = snap.data().text;
    functions.logger.log("Moderating", context.params.documentId, originalText);

    let capitalizedText = capitalize(originalText);
    let moderatedText = filter.clean(capitalizedText);
    return snap.ref.set(
      { text: moderatedText, sanitized: true, moderated: true },
      { merge: true }
    );
  });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
