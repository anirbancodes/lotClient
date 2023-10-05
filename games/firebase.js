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
import { fc } from "/js/c.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

const app = initializeApp(fc);
const db = getFirestore(app);
const auth = getAuth();

// const logoutBtn = document.getElementById("logoutBtn");
// logoutBtn.addEventListener("click", (e) => {
//   signOut(auth)
//     .then(() => {
//       //logout
//     })
//     .catch((error) => {
//       alert(error);
//     });
// });

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
async function historyTable(email, date) {
  document.getElementById("game-table").innerHTML = "";
  //`<div class="upper-white-card">`;
  document.getElementById("comment-text").innerHTML = "";
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }
  console.log(date);
  // if (!match) {
  //   match = "9:0 AM";
  // }
  const ref = doc(db, "users", email, "lotto", date);

  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const games = docSnap.data();
    // const game = games[match];
    let keys = Object.keys(games).sort().reverse();
    keys.forEach((match) => {
      let rowData =
        `<div class="client m-b-5" style=" width: 100px;
        margin-right: 5px;">
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
  // document.getElementById("game-table").innerHTML += `</div>`;
}
const showBtn = document.getElementById("showBtn");
showBtn.addEventListener("click", async () => {
  let date = document.getElementById("date").value;
  //let match = document.getElementById("history-match").value;
  //console.log(match);
  let i1 = date.indexOf("-"),
    i2 = date.lastIndexOf("-");
  date =
    date.substring(0, i1 + 1) +
    (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
    "-" +
    (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  console.log(date);
  await historyTable(auth.currentUser.email, date);
});
