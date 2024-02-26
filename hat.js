
const TEAMS = {
    GOLDYNROAR : {id:1,color:'#6e1a1f',name:'goldynroar'},
    SERPENTISS : {id:2,color:'#0c3d37',name:'serpentiss'},
    TALONFALL : {id:3,color:'#371a6e',name:'talonfall'},
    BERENHEART : {id:4,color:'#9f3f1c',name:'berenheart'},
    CACKLESTAG : {id:5,color:'#1a456e',name:'cacklestag'}
}

let CURRENT_TEAM = null;
class Hat {

    static THOUGHTS = [
        {
            thought: "Feeling Brave, are you?",
            team: TEAMS.GOLDYNROAR
        },
        {
            thought : "You seem to be a chivalrous sort",
            team : TEAMS.GOLDYNROAR
        },
        {
            thought : "A bottomless well of ambition!",
            team : TEAMS.SERPENTISS
        },
        {
            thought : "Your pride might be your downfall",
            team : TEAMS.SERPENTISS
        },
        {
            thought : "There is much patience in you",
            team : TEAMS.BERENHEART
        },
        {
            thought : "Your sense of loyalty is strong",
            team : TEAMS.BERENHEART
        },
        {
            thought : "The past has no weight on your soul",
            team : TEAMS.CACKLESTAG
        },
        {
            thought : "The future awaits you",
            team : TEAMS.CACKLESTAG
        },
        {
            thought : "You are the careful sort",
            team : TEAMS.TALONFALL
        },
        {
            thought : "Quick witted? Or a Half Wit?",
            team : TEAMS.TALONFALL
        }
    ]



    intialize(scene = null, animation = "none", ANIM_TIME = 1){
        let hat = document.getElementById("hat-main");
        let hatBackground = document.getElementById("hat-bg");
        let hatEyeLeft = document.getElementById("hat-eye-left")
        let hatEyeRight = document.getElementById("hat-eye-right")
        let hatMouth = document.getElementById("hat-mouth")
		let firegif = document.getElementById("firegif")

        hat.style.display="block";
        hatBackground.style.animation=`${ANIM_TIME}s initialize-hat forwards`;
        hatEyeLeft.style.animation=`${ANIM_TIME}s  initialize-hat-eyes forwards 1s`;
        hatEyeRight.style.animation=`${ANIM_TIME}s  initialize-hat-eyes forwards 1s`;
        hatMouth.style.animation=`${ANIM_TIME}s  initialize-hat-mouth forwards 1.5s`;
		firegif.style.animation=`${ANIM_TIME}s  initialize-firegif forwards 1.5s`;
		
        if(scene != null && animation !="none"){
            scene.style.animation = animation;
        }
    } 
    
    float(ANIM_TIME) {
        let hat = document.getElementById("hat-main");
        hat.style.animation= `hat-floating ${ANIM_TIME}s ease-in-out infinite`
    }

    stopThinking(){
        setTimeout(()=>this.displayBadgePage(CURRENT_TEAM.color,CURRENT_TEAM.name),2000);
    }

    displayBadgePage(color,name){
        let badgePage = document.getElementsByTagName('body')[0];
        badgePage.style.animation= "";
        badgePage.style.backgroundColor='';
        document.getElementById('landing').innerHTML= ``;
        let badgeDiv = document.createElement('div');
        badgeDiv.setAttribute("class","badge-div");
        badgeDiv.style.backgroundColor=color;
        // Badge Image
        let badgeImage = document.createElement('img');
        badgeImage.src = `./pics/${name}.png`;
        badgeImage.setAttribute("class","badge-image");
        badgeImage.innerHTML=`<img src="https://github.com/bcdeverell/the-claiming-ceremony/blob/master/pics/${name}_badge.png" width="200px">
        </img>`;
        badgeDiv.appendChild(badgeImage);
        // Congratulations Text
        let congratsText = document.createElement('h2');
        congratsText.setAttribute("class","congrats hp");
        congratsText.innerText = 'Congratulations';
        badgeDiv.appendChild(congratsText);
        // Badge Alert
        let badgeAlert = document.createElement('div');
        badgeAlert.setAttribute("class","badge-alert");
        badgeAlert.innerHTML =`<p> You have been claimed by the class of <strong>${name.charAt(0).toUpperCase() + name.slice(1)} <br> Here's your Badge,</p>`
        // badge
        let badge = document.createElement('img');
        badge.src =`./pics/${name}_badge.png`;
        badge.title = 'Your Badge';
        badge.setAttribute("class","badge");
        // Copied
        let copied = document.createElement('div');
        copied.setAttribute('class','copied');
        copied.innerText = ` Copied !`;

        badge.addEventListener('click',(e)=>{
            badgeAlert.appendChild(copied);

               
               document.getElementsByClassName("badge")[0].title = "Copied!";
            navigator.clipboard.writeText(`${name}`);
        })
        badge.addEventListener('mouseout',()=>  {
            badgeAlert.removeChild(copied);
      
            badge.title = 'Copy to clipboard' });
        badgeAlert.appendChild(badge);
        badgeDiv.appendChild(badgeAlert)
        
        

        badgeDiv.style.animation= "0.5s appear1 3s forwards";

        document.getElementById('landing').appendChild(badgeDiv);
        document.documentElement.style.setProperty("--page-color", color);

        badgePage.style.animation = "3s appear forwards ease";
        setTimeout(()=> {
            confetti.start()
            confetti.speed = 1;
        },3000);
    }
    think(ANIM_TIME){
        let thoughts = document.getElementById("thoughts");
        let randomThought = this.getRandomThought();
        thoughts.innerText = Hat.THOUGHTS[randomThought].thought;
        CURRENT_TEAM = Hat.THOUGHTS[randomThought].team;
        thoughts.style.animation = `type ${ANIM_TIME}s forwards`;
        setTimeout(()=> this.think(ANIM_TIME),ANIM_TIME*1000)
        
    }

     getRandomThought() {
        let min = 0;
        let max = Hat.THOUGHTS.length - 1;
        let index = Math.floor(Math.random() * (max - min + 1) + min); 
        return index;
      }
      

}
