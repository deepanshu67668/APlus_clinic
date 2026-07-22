/* ==========================================================================
   A Plus Dental Clinic & Implant Centre - Firebase Cloud Firestore Setup
   Real-Time Cloud Storage for Appointments, Treatments, Doctors, Blogs, Gallery & Reviews
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyD-placeholder-key-for-aplus-842ec",
  authDomain: "aplus-842ec.firebaseapp.com",
  projectId: "aplus-842ec",
  storageBucket: "aplus-842ec.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f67890"
};

let db = null;
let isFirebaseOnline = false;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    // Enable offline persistence
    db.enablePersistence().catch(err => {
      console.log('Firebase persistence note:', err.code);
    });
    isFirebaseOnline = true;
    console.log('⚡ Firebase Cloud Firestore connected successfully!');
  }
} catch (e) {
  console.warn('Firebase init notice: Running with hybrid local cloud sync.', e);
}
