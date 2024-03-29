
const ANIM_TIME = 2;
const FLOAT_ANIM_TIME = 3;
const THINKING_TIME = 8;
const THINKING_DURATION = 4;
const BROOMS = 20;
const STARS = 100;
const STAR_ANIMATION_TIME = 20;
let hat = new Hat();
let start_time = 0;
let scene = document.getElementsByTagName("html")[0];
    var elem = document.getElementsByTagName("html")[0];

document.addEventListener('click',()=>{
    let audio = document.getElementById("background_music");
    if(audio.autoplay == false) 
    {
        audio.muted = false
        audio.autoplay = true
		 audio.volume = 0.3;
        audio.play();

    }
})

hat.intialize(scene,"1s initialize-scene forwards",ANIM_TIME);

document.getElementById("sort-btn").addEventListener("click", () => {
  window.location.replace("/claiming.html");
});


function flyBrooms () {
    let background = document.getElementsByTagName("body")[0];
    for(let i=0;i<BROOMS;i++){
        let broom = document.createElement('i');
        broom.classList="fas fa-broom";
        broom.style.backgroundColor="#fff";
        background.appendChild(broom);
    }   
}

function starAnimate() {
    let background = document.getElementById("stars")
    for(let i=0;i<STARS;i++){
        let star = document.createElement('p');
        star.classList="star";
        star.style.top =(100*Math.random()) + "%";
        star.style.left = (100*Math.random()) + "%";
        star.style.animation= `${STAR_ANIMATION_TIME}s move-stars infinite`;
        background.appendChild(star);
    }   
}

starAnimate();

