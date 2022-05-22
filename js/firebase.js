const firebaseConfig = {
  apiKey: "AIzaSyAVgBu0P69xgUHnZ2Cc4G5IX6gHtb4-MBE",
  authDomain: "qclottery.firebaseapp.com",
  projectId: "qclottery",
  storageBucket: "qclottery.appspot.com",
  messagingSenderId: "650163027647",
  appId: "1:650163027647:web:961de905315b549657500a",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getDoc,
  doc,
  arrayUnion,
  runTransaction,
  increment,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { fetchTime } from "./index.js";

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
    //showUserEmail(user.email);
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
  }
}

function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent = name;
  document.getElementById("user-credit").textContent = credit;
}

let betClicked = false;
//game - bet clicked
async function play(email, number, amount) {
  betClicked = true;
  const ref = doc(db, "users", email);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    if (amount <= data.credit) {
      const t22 = await fetchTime();
      const date = t22.date,
        time = t22.time,
        ampm = t22.ampm;
      let min = t22.min,
        sec = t22.sec,
        gameHr = t22.hr;
      let gameMin = Math.ceil(min / 15) * 15;
      if (min == 0 || min == 15 || min == 30 || min == 45) gameMin += 15;
      if (gameMin == 60 && gameHr != 12) {
    gameMin = 0;
    gameHr++;
  } else if (gameMin == 60 && gameHr == 12) {
    gameMin = 0;
    gameHr = 1;
  }
     
      let drawTime;
      if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM";
      else if (gameHr > 9 && ampm == "PM" && gameHr !=12) {
        alert("Game Closed");
        betClicked = false;
        return;
      } else drawTime = gameHr + ":" + gameMin + " " + ampm;

      // if (min % 10 == 9 && sec >= 50) {
      //   alert("Time UP");
      //   window.location = "/";
      //   return;
      // }
      //
      try {
        await runTransaction(db, async (transaction) => {
          const gamesDateDoc = await transaction.get(doc(db, "games", date));

          const gamesDealerDoc = await transaction.get(
            doc(db, "users", email, "lotto", date)
          );
          if (!gamesDateDoc.exists()) {
            transaction.set(doc(db, "games", date), {});
          }

          if (!gamesDealerDoc.exists()) {
            transaction.set(doc(db, "users", email, "lotto", date), {});
            transaction.set(doc(db, "users", email, "sale", date), {});
          }

          transaction.update(
            doc(db, "games", date),
            {
              [`${drawTime}.${number}`]: arrayUnion({
                amt: amount,
                t: "c",
                time: time + " " + ampm,
                email: email,
              }),
            },
            { merge: true }
          );

          transaction.update(doc(db, "users", email), {
            credit: increment(-1 * amount),
            totPlay: increment(amount),
          });

          transaction.update(
            doc(db, "users", email, "lotto", date),
            {
              [`${drawTime}.${number}`]: increment(amount),
            },
            { merge: true }
          );
          transaction.update(
            doc(db, "users", email, "sale", date),
            {
              [`${drawTime}`]: increment(Number(amount)),
            },
            { merge: true }
          );
        });
        console.log("Transaction successfully committed!");
      } catch (e) {
        alert("Transaction failed: ", e);
      }

      betClicked = false;
      //window.location = "/";
      document.getElementById("bet-amt").value = 0;
    } else {
      alert(`insufficient credits, add credits`);
    }
  }
}

const btn = document.getElementById("btn-submit");
btn.addEventListener("click", async (e) => {
  if (betClicked === true) return;

  const bet_amt = Number(document.getElementById("bet-amt").value);
  let bet_no;
  let ele = document.getElementsByName("scrip");
  for (let i = 0; i < ele.length; i++) {
    if (ele[i].checked) bet_no = ele[i].value;
  }
  if (bet_amt >= 10) {
    const email = auth.currentUser.email;
    await play(email, bet_no, bet_amt, false);
    const ref = doc(db, "users", email);
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      let data = docSnap.data();
      showUserCredits(data.name, data.credit);
    }
  } else {
    alert("bet atleast 10 credit");
    //betClicked = false;
  }
});
