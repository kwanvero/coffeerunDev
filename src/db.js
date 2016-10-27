import firebase from 'firebase'

// Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAIf701PZjv2iwjk_BDP_pWhG_xa7TTLSQ",
    authDomain: "havajava-15b0f.firebaseapp.com",
    databaseURL: "https://havajava-15b0f.firebaseio.com",
    storageBucket: "havajava-15b0f.appspot.com",
    // storageBucket: "",
    messagingSenderId: "956395041653"
});

export default firebase.database()
