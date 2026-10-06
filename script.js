const $=id=>document.getElementById(id);
const API="https://discoveryprovider.audius.co/v1",APP="WaveTune";

let songs=[],current=0,page=0,shuffle=false,repeat=false,auto=true,mode="home";
let fav=JSON.parse(localStorage.favSongs||"[]");
let recent=JSON.parse(localStorage.recentSongs||"[]");
let downloads=JSON.parse(localStorage.downloads||"[]");

const audio=$("audio"),cards=$("musicCards"),list=$("songList");
const search=$("searchInput"),more=$("loadMoreBtn");
const cover=$("albumCover"),pt=$("playerTitle"),pa=$("playerArtist");
const play=$("playBtn"),next=$("nextBtn"),prev=$("previousBtn");
const progress=$("progress"),cur=$("currentTime"),duration=$("duration");
const volume=$("volume"),vbtn=$("volumeBtn"),heart=$("playerFavorite");
const theme=$("themeBtn");

const pics=[
"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600",
"https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600",
"https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600",
"https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600"
];

const img=(x,n)=>x||pics[n%pics.length];
const esc=x=>String(x||"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const tm=s=>s?`${s/60|0}:${String(s%60|0).padStart(2,"0")}`:"0:00";

function toast(x){
 const t=$("toast"),m=$("toastMessage");
 if(t&&m){m.textContent=x;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1600)}
}

/* ONLINE MUSIC */

async function getSongs(q=""){
 let url=q?
 `${API}/tracks/search?query=${encodeURIComponent(q)}&limit=30&app_name=${APP}`:
 `${API}/tracks/trending?limit=30&offset=${page}&app_name=${APP}`;

 try{
  let d=await(await fetch(url)).json();
  return (d.data||[]).map((x,n)=>({
   id:x.id,
   title:x.title||"Unknown Song",
   artist:x.user?.name||"Unknown Artist",
   cover:img(x.artwork?x.artwork._480x480:null,n),
   duration:x.duration||0,
   plays:x.play_count||0,
   audio:`${API}/tracks/${x.id}/stream?app_name=${APP}`
  }));
 }catch(e){
  return [];
 }
}

/* MAIN LOAD */

async function load(){
 mode="home";
 page=0;
 cards.innerHTML='<div class="loading"><div class="loader"></div>Loading Music...</div>';

 let data=await getSongs(search.value.trim());

 if(!data.length){
  offline();
  return;
 }

 songs=data;
 render();
}

/* RENDER EVERYTHING */

function render(){
 let data=[...songs];

 if(mode==="favorites")data=fav;
 if(mode==="recent")data=recent;
 if(mode==="downloads")data=downloads;
 if(mode==="recommended")data=[...songs].sort(()=>Math.random()-.5);

 /* ARTISTS */

 if(mode==="artists"){
  let a=[...new Map(songs.map(x=>[x.artist,x])).values()];

  cards.innerHTML=a.map((x,n)=>`
   <div class="music-card" onclick="artistSearch('${esc(x.artist)}')">
    <div class="music-image">
     <img src="${img(x.cover,n)}">
    </div>
    <h3>${esc(x.artist)}</h3>
    <p>Artist</p>
   </div>`).join("");

  list.innerHTML="";
  return;
 }

 /* ALBUMS */

 if(mode==="albums"){
  cards.innerHTML=songs.slice(0,10).map((x,n)=>`
   <div class="music-card" onclick="playSong('${x.id}')">
    <div class="music-image">
     <img src="${img(x.cover,n)}">
     <button class="card-play">
      <i class="fa-solid fa-play"></i>
     </button>
    </div>
    <h3>${esc(x.title)}</h3>
    <p>${esc(x.artist)}</p>
   </div>`).join("");

  list.innerHTML="";
  return;
 }

 /* PODCAST */

 if(mode==="podcast"){
  cards.innerHTML=`
   <div class="music-card">
    <div class="music-image"><img src="${pics[0]}"></div>
    <h3>Music Talks</h3><p>Music & Artists</p>
   </div>

   <div class="music-card">
    <div class="music-image"><img src="${pics[1]}"></div>
    <h3>Daily Vibes</h3><p>Entertainment</p>
   </div>

   <div class="music-card">
    <div class="music-image"><img src="${pics[2]}"></div>
    <h3>Sound Stories</h3><p>Creative Talks</p>
   </div>

   <div class="music-card">
    <div class="music-image"><img src="${pics[3]}"></div>
    <h3>Behind Music</h3><p>Artists & Culture</p>
   </div>`;

  list.innerHTML="";
  return;
 }

 /* CARDS */

 cards.innerHTML=data.slice(0,5).map((x,n)=>`
  <div class="music-card" onclick="playData(${n})">

   <div class="music-image">
    <img src="${img(x.cover,n)}">

    <button class="card-play">
     <i class="fa-solid fa-play"></i>
    </button>

    <button class="card-heart"
     onclick="event.stopPropagation();favorite('${x.id}')">
     <i class="${fav.some(z=>z.id===x.id)?"fa-solid":"fa-regular"} fa-heart"></i>
    </button>

   </div>

   <h3>${esc(x.title)}</h3>
   <p>${esc(x.artist)}</p>

  </div>`).join("");

 /* TRACK LIST */

 list.innerHTML=data.map((x,n)=>`
  <div class="track">

   <span class="track-number">${n+1}</span>

   <div class="track-song">

    <img src="${img(x.cover,n)}">

    <div class="track-info">
     <h4>${esc(x.title)}</h4>
     <p>${esc(x.artist)}</p>
    </div>

    <button class="mini-play"
     onclick="playData(${n})">
     <i class="fa-solid fa-play"></i>
    </button>

   </div>

   <span class="track-plays">${x.plays||"—"}</span>

   <span class="track-time">${tm(x.duration)}</span>

   <div class="track-actions">

    <button onclick="favorite('${x.id}')">
     <i class="${fav.some(z=>z.id===x.id)?"fa-solid":"fa-regular"} fa-heart"></i>
    </button>

    <button onclick="downloadSong('${x.id}')">
     <i class="fa-solid fa-download"></i>
    </button>

   </div>

  </div>`).join("");
}

/* PLAY */

function playData(n){
 let d=mode==="favorites"?fav:
       mode==="recent"?recent:
       mode==="downloads"?downloads:songs;

 if(d[n])playSong(d[n].id);
}

function playSong(id){
 let x=songs.find(z=>z.id===id)||
       fav.find(z=>z.id===id)||
       recent.find(z=>z.id===id)||
       downloads.find(z=>z.id===id);

 if(!x)return;

 current=songs.findIndex(z=>z.id===id);

 audio.src=x.audio;
 pt.textContent=x.title;
 pa.textContent=x.artist;
 cover.src=img(x.cover,current);

 recent=[x,...recent.filter(z=>z.id!==x.id)].slice(0,30);
 localStorage.recentSongs=JSON.stringify(recent);

 audio.play().catch(()=>{});
 state();
 favState();
}

/* PLAYER */

function state(){
 play.innerHTML=audio.paused?
 '<i class="fa-solid fa-play"></i>':
 '<i class="fa-solid fa-pause"></i>';
}

play.onclick=()=>{
 if(!audio.src){
  if(songs[0])playSong(songs[0].id);
  return;
 }

 audio.paused?audio.play():audio.pause();
 state();
};

next.onclick=()=>{
 if(!songs.length)return;

 let n=shuffle?
 Math.floor(Math.random()*songs.length):
 (current+1)%songs.length;

 playSong(songs[n].id);
};

prev.onclick=()=>{
 if(!songs.length)return;
 playSong(songs[(current-1+songs.length)%songs.length].id);
};

audio.onplay=state;
audio.onpause=state;

audio.onended=()=>{
 if(repeat){
  audio.currentTime=0;
  audio.play();
 }else if(auto)next.click();
};

audio.ontimeupdate=()=>{
 if(audio.duration){
  progress.max=audio.duration;
  progress.value=audio.currentTime;
  cur.textContent=tm(audio.currentTime);
  duration.textContent=tm(audio.duration);
 }
};

progress.oninput=()=>audio.currentTime=progress.value;

volume.oninput=()=>audio.volume=volume.value/100;

vbtn.onclick=()=>{
 if(audio.volume){
  audio.dataset.old=audio.volume;
  audio.volume=0;
  vbtn.innerHTML='<i class="fa-solid fa-volume-xmark"></i>';
 }else{
  audio.volume=+(audio.dataset.old||.8);
  vbtn.innerHTML='<i class="fa-solid fa-volume-high"></i>';
 }
};

/* SHUFFLE / REPEAT / AUTOPLAY */

$("shuffleBtn").onclick=()=>{
 shuffle=!shuffle;
 $("shuffleBtn").classList.toggle("active",shuffle);
 toast(shuffle?"Shuffle ON":"Shuffle OFF");
};

$("repeatBtn").onclick=()=>{
 repeat=!repeat;
 $("repeatBtn").classList.toggle("active",repeat);
 toast(repeat?"Repeat ON":"Repeat OFF");
};

$("autoplayBtn").onclick=()=>{
 auto=!auto;
 $("autoplayBtn").classList.toggle("active",auto);
 toast(auto?"Autoplay ON":"Autoplay OFF");
};

/* FAVORITE */

function favorite(id){
 let x=songs.find(z=>z.id===id)||
       recent.find(z=>z.id===id)||
       downloads.find(z=>z.id===id);

 if(!x)return;

 if(fav.some(z=>z.id===id)){
  fav=fav.filter(z=>z.id!==id);
  toast("Removed from Favorites");
 }else{
  fav.push(x);
  toast("Added to Favorites ❤️");
 }

 localStorage.favSongs=JSON.stringify(fav);
 render();
 favState();
}

function favState(){
 let x=songs[current];

 if(x)
  heart.innerHTML=
  `<i class="${fav.some(z=>z.id===x.id)?"fa-solid":"fa-regular"} fa-heart"></i>`;
}

heart.onclick=()=>{
 let x=songs[current];
 if(x)favorite(x.id);
};

/* DOWNLOAD */

async function downloadSong(id){
 let x=songs.find(z=>z.id===id);

 if(!x)return;

 if(downloads.some(z=>z.id===id)){
  toast("Already in My Library");
  return;
 }

 /*
  Browser storage mein metadata save hota hai.
  Actual stream ko offline permanently save karna
  source/browser restrictions par depend karta hai.
 */
 downloads.push(x);
 localStorage.downloads=JSON.stringify(downloads);

 toast("Added to My Library");
}

/* SEARCH */

let timer;

search.oninput=()=>{
 clearTimeout(timer);
 timer=setTimeout(load,400);
};

/* LOAD MORE */

more.onclick=async()=>{
 page++;
 let data=await getSongs();
 songs.push(...data);
 render();
};

/* TOP TABS */

document.querySelectorAll(".tab").forEach((b,n)=>{
 b.onclick=async()=>{

  document.querySelectorAll(".tab")
   .forEach(x=>x.classList.remove("active"));

  b.classList.add("active");
  search.value="";

  if(n===0){
   mode="home";
   songs=await getSongs();
  }

  if(n===1){
   mode="home";
   songs=await getSongs();
  }

  if(n===2){
   mode="recommended";

   if(!songs.length)
    songs=await getSongs();
  }

  render();
 };
});

/* SIDEBAR */

document.querySelectorAll(".side-link").forEach(b=>{
 b.onclick=async()=>{

  let t=b.textContent.trim().toLowerCase();

  document.querySelectorAll(".side-link")
   .forEach(x=>x.classList.remove("active"));

  b.classList.add("active");

  if(t==="home"){
   search.value="";
   await load();
  }

  else if(t==="discover"){
   search.focus();
   toast("Search music above");
  }

  else if(t==="artists"){
   if(!songs.length)songs=await getSongs();
   mode="artists";
   render();
  }

  else if(t==="albums"){
   if(!songs.length)songs=await getSongs();
   mode="albums";
   render();
  }

  else if(t==="my library"){
   mode="downloads";
   render();
  }

  else if(t==="podcast"){
   mode="podcast";
   render();
  }

  else if(t==="recently played"){
   mode="recent";
   render();
  }

  else if(t==="favorites"){
   mode="favorites";
   render();
  }
 };
});

/* PROFILE */

document.querySelector(".profile-pic").onclick=()=>{
 let old=document.querySelector(".profile-menu");

 if(old){
  old.remove();
  return;
 }

 let box=document.createElement("div");

 box.className="profile-menu";

 box.innerHTML=`
  <strong>WaveTune User</strong>
  <small>Online Music Player</small>

  <button onclick="profileAction('library')">
   <i class="fa-solid fa-music"></i> My Library
  </button>

  <button onclick="profileAction('fav')">
   <i class="fa-solid fa-heart"></i> Favorites
  </button>

  <button onclick="profileAction('recent')">
   <i class="fa-solid fa-clock"></i> Recently Played
  </button>

  <button onclick="profileAction('theme')">
   <i class="fa-solid fa-moon"></i> Change Theme
  </button>

  <button onclick="profileAction('close')">
   <i class="fa-solid fa-xmark"></i> Close
  </button>`;

 document.querySelector(".topbar").appendChild(box);
};

function profileAction(x){
 document.querySelector(".profile-menu")?.remove();

 if(x==="library"){
  mode="downloads";
  render();
 }

 if(x==="fav"){
  mode="favorites";
  render();
 }

 if(x==="recent"){
  mode="recent";
  render();
 }

 if(x==="theme")theme.click();
}

/* ARTIST SEARCH */

function artistSearch(name){
 search.value=name;
 load();
}

/* DARK / LIGHT */

theme.onclick=()=>{
 let light=document.body.classList.toggle("light");

 localStorage.theme=light?"light":"dark";

 theme.innerHTML=
 `<i class="fa-solid fa-${light?"sun":"moon"}"></i>`;

 toast(light?"Light Mode":"Dark Mode");
};

if(localStorage.theme==="light"){
 document.body.classList.add("light");
 theme.innerHTML='<i class="fa-solid fa-sun"></i>';
}

/* MOBILE */

$("mobileMenu")?.addEventListener("click",()=>{
 $("sidebar").classList.toggle("open");
});

/* KEYBOARD */

document.onkeydown=e=>{
 if(e.target.tagName==="INPUT")return;

 if(e.code==="Space"){
  e.preventDefault();
  play.click();
 }

 if(e.key==="ArrowRight")next.click();
 if(e.key==="ArrowLeft")prev.click();
 if(e.key.toLowerCase()==="m")vbtn.click();
};

/* OFFLINE */

function offline(){

 if(downloads.length){
  songs=downloads;
  mode="downloads";
  render();
  toast("Offline Music");
 }else{
  cards.innerHTML=`
   <div class="loading">
    <i class="fa-solid fa-wifi"></i>
    <p>No internet & no saved songs</p>
   </div>`;

  list.innerHTML="";
 }
}

window.addEventListener("offline",offline);

window.addEventListener("online",()=>{
 toast("Internet Connected");
 load();
});

/* START */

audio.volume=.8;
load();