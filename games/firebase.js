import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import {
  getDoc,
  doc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
const firebaseConfig = {
  apiKey: "AIzaSyAVgBu0P69xgUHnZ2Cc4G5IX6gHtb4-MBE",
  authDomain: "qclottery.firebaseapp.com",
  projectId: "qclottery",
  storageBucket: "qclottery.appspot.com",
  messagingSenderId: "650163027647",
  appId: "1:650163027647:web:961de905315b549657500a",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", (e) => {
  signOut(auth)
    .then(() => {
      //logout
    })
    .catch((error) => {
      alert(error);
    });
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    loadUserData(user.email);
  } else {
    window.location = "/pages/login.html";
  }
});

async function loadUserData(email) {
  const ref = doc(db, "users", email);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    showUserCredits(data.name, data.credit);
    historyTable(email);
  }
}

function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent += name;
  document.getElementById("user-credit").textContent = credit;
}
async function historyTable(email, date, match) {
  document.getElementById(
    "game-table"
  ).innerHTML = `<div class="upper-white-card">`;
  document.getElementById("comment-text").innerHTML = "";
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }
  if (!match) {
    match = "9:0 AM";
  }
  const ref = doc(db, "users", email, "games", date);

  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const games = docSnap.data();
    // const game = games[match];
    let keys = Object.keys(games);
    keys.forEach((match) => {
      let rowData =
        `<div class="client m-b-5">
        <div class="p-1-5">
          <p>` +
        match +
        `</p>`;
      for (let i = 0; i < 10; i++) {
        if (!games[match][i]) continue;

        rowData +=
          `
              <div class="card-inner">
                <p style="color: orangered">` +
          i +
          `</p>
          <p class="m-l-10">` +
          games[match][i] +
          `
          </p></div>
           `;
      }
      document.getElementById("game-table").innerHTML +=
        rowData +
        `</div>
      </div>`;
    });
  }
  document.getElementById("game-table").innerHTML += `</div>`;
}
const showBtn = document.getElementById("showBtn");
showBtn.addEventListener("click", () => {
  let date = document.getElementById("date").value;
  let match = document.getElementById("history-match").value;
  console.log(match);
  let i1 = date.indexOf("-"),
    i2 = date.lastIndexOf("-");
  date =
    date.substring(0, i1 + 1) +
    (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
    "-" +
    (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  historyTable(auth.currentUser.email, date, match);
});
