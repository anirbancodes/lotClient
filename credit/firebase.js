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
//import { fetchTime } from "./index.js";
onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    //showUserEmail(user.email);
    loadUserData(user.email);
  } else {
    window.location = "/pages/login.html";
  }
});
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

async function loadUserData(email) {
  const ref = doc(db, "users", email);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    showUserCredits(data.name, data.credit);
    let now = new Date();
    let date =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    console.log(date);
    historyTable(email, date);
  }
}

function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent += name;
  document.getElementById("user-credit").textContent = credit;
}
async function historyTable(email, date) {
  document.getElementById("comment-text").innerText = "";
  document.getElementById("credits-list").innerHTML = "";

  const ref = doc(db, "users", email, "credits", date);
  const docSnap = await getDoc(ref);
  const credits = docSnap.data().lotto;

  if (!credits) {
    document.getElementById("comment-text").innerText =
      "No credits transfer today";
    return;
  }
  credits.forEach((i) => {
    document.getElementById("credits-list").innerHTML +=
      `<div class="client m-b-5">
    <div class="p-1-5">
      <p>` +
      (i.dg == "d" ? "Dealer" : "Game Credit") +
      `</p>
      <div class="card-inner">
        <p style="color: orangered">` +
      (i.amt > 0 ? "+" : "-") +
      i.amt +
      `</p>
        <p>` +
      i.time +
      `</p>
      </div>
    </div>
  </div>`;
  });
}
const showBtn = document.getElementById("showBtn");
showBtn.addEventListener("click", () => {
  let date = document.getElementById("date").value;
  let i1 = date.indexOf("-"),
    i2 = date.lastIndexOf("-");
  date =
    date.substring(0, i1 + 1) +
    (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
    "-" +
    (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }

  historyTable(auth.currentUser.email, date);
});
