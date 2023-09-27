import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { fc } from "/js/c.js";
import {
  getDoc,
  doc,
  arrayUnion,
  runTransaction,
  increment,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { fetchTime } from "./index.js";

console.log("sa");

const app = initializeApp(fc);
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
    if (data.active == false) activateClient(email, data.name);
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
      if (gameHr == 12 && gameMin == 0 && ampm == "AM") ampm = "PM";
      if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM";
      else if (
        (gameHr > 9 && ampm == "PM" && gameHr != 12) ||
        (gameHr == 9 && gameMin > 0 && ampm == "PM" && gameHr != 12) ||
        (gameHr == 12 && ampm == "AM")
      ) {
        alert("Game Closed");
        betClicked = false;
        return;
      } else drawTime = gameHr + ":" + gameMin + " " + ampm;

      if (
        (min % 10 == 59 && sec >= 45) ||
        (min % 10 == 14 && sec >= 45) ||
        (min % 10 == 29 && sec >= 45) ||
        (min % 10 == 44 && sec >= 45)
      ) {
        alert("Time UP");
        window.location = "/";
        return;
      }

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
            doc(db, "dealers", data.dEmail, clientsale, date),
            {
              sale: increment(amount),
            },
            { merge: true }
          );

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
        // console.log("Transaction successfully committed!");
      } catch (e) {
        alert("Transaction failed: ", e);
      }

      betClicked = false;
      //window.location = "/";
      document.getElementById("bet-amt").value = 0;
    } else {
      alert(`Insufficient balance`);
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

async function activateClient(email, name) {
  try {
    await runTransaction(db, async (transaction) => {
      transaction.update(
        doc(db, "users", email),
        {
          active: true,
        },
        { merge: true }
      );
      transaction.set(doc(db, "users", email, "credits", "0"), {});

      transaction.set(doc(db, "users", email, "lotto", "0"), {});

      transaction.set(doc(db, "users", email, "sale", "0"), {});

      // console.log("Client Doc created");
    });
  } catch (e) {
    alert("Activation failed");
    // console.error(e);
  }
}

const dtimes = [
  "9:0 PM",
  "8:45 PM",
  "8:30 PM",
  "8:15 PM",
  "8:0 PM",
  "7:45 PM",
  "7:30 PM",
  "7:15 PM",
  "7:0 PM",
  "6:45 PM",
  "6:30 PM",
  "6:15 PM",
  "6:0 PM",
  "5:45 PM",
  "5:30 PM",
  "5:15 PM",
  "5:0 PM",
  "4:45 PM",
  "4:30 PM",
  "4:15 PM",
  "4:0 PM",
  "3:45 PM",
  "3:30 PM",
  "3:15 PM",
  "3:0 PM",
  "2:45 PM",
  "2:30 PM",
  "2:15 PM",
  "2:0 PM",
  "1:45 PM",
  "1:30 PM",
  "1:15 PM",
  "1:0 PM",
  "12:45 PM",
  "12:30 PM",
  "12:15 PM",
  "12:0 PM",
  "11:45 AM",
  "11:30 AM",
  "11:15 AM",
  "11:0 AM",
  "10:45 AM",
  "10:30 AM",
  "10:15 AM",
  "10:0 AM",
  "9:45 AM",
  "9:30 AM",
  "9:15 AM",
  "9:0 AM",
];

async function saleTbody() {
  // const apiObj = fetchTime;
  let date = fetchTime.date; //,apiTime = fetchTime.time;
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }
  // if (date == apiDate) {
  //   //today
  // }
  // document.getElementById("today").innerHTML = date;
  const ref = doc(db, "result", date);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const result = docSnap.data();
    document.getElementById(
      "sale-tbody"
    ).innerHTML = `<li class="table-header li">
            <div class="col2">Time</div>
            <div class="col2">Lucky No.</div>
          </li>`;
    // let keys = Object.keys(result);
    // keys.forEach((dtime) => {
    dtimes.forEach((dtime) => {
      if (result[dtime] != undefined || result[dtime] != null)
        document.getElementById("sale-tbody").innerHTML +=
          `<li class="table-row li">
      <div class="col2">` +
          dtime +
          `</div>
      <div class="col2 or2" ><strong>` +
          result[dtime] +
          `</strong></div>
    </li>`;
    });
  } else {
    document.getElementById("sale-tbody").innerHTML = "No Permission";
  }
}
saleTbody();
const refreshResBtn = document.getElementById("refreshResBtn");
refreshResBtn.addEventListener("click", () => {
  let date = document.getElementById("date").value;
  if (date) {
    let i1 = date.indexOf("-"),
      i2 = date.lastIndexOf("-");
    date =
      date.substring(0, i1 + 1) +
      (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
      "-" +
      (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  } else if (!date) {
    let now = new Date();
    date = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
  }
  saleTbody(date);
});
