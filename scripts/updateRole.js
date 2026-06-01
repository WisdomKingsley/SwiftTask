
const { initializeApp } = require('firebase/app');

const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {

  apiKey: "AIzaSyCmHVfolzMZ8Kz8brXmAVrghkCLD2oY21w",

  authDomain: "swifttask-878fb.firebaseapp.com",

  projectId: "swifttask-878fb",

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

async function update() {

  const ref = doc(db, 'users', '+2348146174667');

  await updateDoc(ref, { role: 'provider' });

  console.log('✅ Role updated to provider!');

  process.exit(0);

}

update();

