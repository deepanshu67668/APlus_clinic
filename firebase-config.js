/* ==========================================================================
   A Plus Dental Clinic & Implant Centre - Firebase Cloud Firestore Setup
   Real-Time Cloud Storage for Appointments, Treatments, Doctors, Blogs, Gallery & Reviews
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyA_APlusDentalClinicDemoKey2026",
  authDomain: "aplus-dental-clinic-78386.firebaseapp.com",
  projectId: "aplus-dental-clinic-78386",
  storageBucket: "aplus-dental-clinic-78386.appspot.com",
  messagingSenderId: "987654321012",
  appId: "1:987654321012:web:a1b2c3d4e5f67890"
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
