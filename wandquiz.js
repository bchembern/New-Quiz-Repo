const allQuestions = [
  "Which of the following would you most hate people to call you?",
  "Once every century, the Flutterby bush produces flowers that adapt their scent to attract the unwary. If it lured you, it would smell of:",
  "Given the choice, would you rather invent a potion that would guarantee you:",
  "After you have died, what would you most like people to do when they hear your name?",
  "What kind of instrument most pleases your ear?",
  "Which of the following do you find most difficult to deal with?",
  "Which of the following would you most like to study?",
  "Late at night, walking alone down the street, you hear a peculiar cry that you believe to have a magical source. Do you:",
  "You and two friends need to cross a bridge guarded by a river troll who insists on fighting one of you before he will let all of you pass. Do you:",
  "Moon or Stars?",
  "Black or White?",
  "Dawn or Dusk?",
  "Left or Right?",
  "Heads or Tails?",
  "Forest or River?",
  "You enter an enchanted garden. What would you be most curious to examine first?",
  "Four goblets are placed before you. Which would you choose to drink?",
  "Four boxes are placed before you. Which would you try and open:",
  "A Muggle confronts you and says that they are sure you are a witch or wizard. Do you:",
  "What are you most looking forward to learning at Hogwarts?",
  "Which would you rather be?",
  "If you could have any power, which would you choose?",
  "One of your house mates has cheated in a Hogwarts exam by using a Self-Spelling Quill. Now he has come top of the class in Charms, beating you into second place. Professor Flitwick is suspicious of what happened. He draws you to one side after his lesson and asks you whether or not your classmate used a forbidden quill. What do you do?",
  "A troll has gone berserk in the Headmaster's study at Hogwarts. It is about to smash, crush and tear several irreplaceable items and treasures. In which order would you rescue these objects from the troll's club, if you could?",
  "Which road tempts you most?",
  "Which nightmare would frighten you most?",
  "How would you like to be known to history?"
];

const allAnswers = [
  ["Ordinary","Ignorant","Cowardly","Selfish"],
  ["A crackling log fire","The sea","Fresh parchment","Home"],
  ["Love","Glory","Wisdom","Power"],
  ["Miss you, but smile.", "Ask for more stories about your adventures.","Think with admiration of your achievements.","I do not care what people think of me after I am dead; it is what they think of me while I am alive that counts."],
  ["The violin","The trumpet","The piano","The drum"],
  ["Cold","Loneliness","Boredom","Being ignored"],
  ["Ghosts","Vampires","Trolls","Centaurs"],
  ["Proceed with caution, keeping one hand on your concealed wand and an eye out for any disturbance.","Draw your wand and try to find the source of the noise.", "Draw your wand and stand your ground.","Withdraw into the shadows to await developments, while mentally reviewing the most appropriate defensive and offensive spells, should trouble occur?"],
  ["Attempt to confuse the troll into letting all three of you pass without fighting.","Suggest drawing lots to decide which of you will fight.","Suggest that all three of you should fight (without telling the troll).","Volunteer to fight."],
  ["Moon","Stars"],
  ["Black","White"],
  ["Dawn", "Dusk"],
  ["Left", "Right"],
  ["Heads","Tails"],
  ["Forest","River"],
  ["The silver leafed tree bearing golden apples","The fat red toadstools that appear to be talking to each other","The bubbling pool, in the depths of which something luminous is swirling","The statue of an old wizard with a strangely twinkling eye."],
  ["The foaming, frothing, silvery liquid that sparkles as though containing ground diamonds.","The smooth, thick, richly purple drink that gives off a delicious smell of chocolate and plums.","The golden liquid so bright that it hurts the eye, and which makes sunspots dance all around the room.","The mysterious black liquid that gleams like ink, and gives off fumes that make you see strange visions."],
  ["The small tortoiseshell box, embellished with gold, inside which some small creature seems to be squeaking.","The gleaming jet black box with a silver lock and key, marked with a mysterious rune that you know to be the mark of Merlin.","The ornate golden casket, standing on clawed feet, whose inscription warns that both secret knowledge and unbearable temptation lie within.","The small pewter box, unassuming and plain, with a scratched message upon it that reads: I open only for the worthy."],
  ["Ask what makes them think so?","Agree, and ask whether they would like a free sample of a jinx?","Agree, and walk away, leaving them to wonder whether you are bluffing?","Tell them that you are worried about their mental health, and offer to call a doctor."],
  ["Every area of magic I can.","Hexes and jinxes.","All about magical creatures, and how to befriend or care for them.","Flying on a broomstick."],
  ["Feared","Trusted","Imitated","Praised"],
  ["The power to speak to animals.","The power to change your appearance at will.","The power to read minds.","The power of invisibility."],
  ["Lie and say you don't know (but hope that somebody tells the truth).","Tell Professor that he ought to ask your classmate.","Tell Professor the truth. If your classmate is prepared to win by cheating, he deserves to be found out.","If you knew somebody was using a forbidden quill, you would tell the teacher before the exam started."],
  ["Dragon pox cure","Student records","Merlin's book","Invisibility cloak"],
  ["The narrow, dark, lantern-lit alley.","The twisting, leaf-strewn path through the woods.","The cobbled street lined with ancient buildings","The wide, sunny, grassy lane."],
  ["Standing on top of something very high and realizing suddenly that there are no hand or footholds, nor any barrier to stop you falling.","An eye at the keyhole of the dark, windowless room in which you are locked.","Waking up to find that neither your friends nor your family have any idea who you are.","Being forced to speak in such a silly voice that hardly anyone can understand you, and everyone laughs at you."],
  ["The wise","The good","The great","The bold"]
];

const houseType = [
  ['c','b','t','g','s'],
  ['g','b','s','t','c'],
  ['g','c','t','s','b'],
  ['c','g','b','t','s'],
  ['b','c','g','t','s'],
  ['b','t','c','g','s'],
  ['g','c','b','s','t'],
  ['c','b','s','g','t'],
  ['t','s','c','b','g'],
  ['c','g'],
  ['s','c'],
  ['b','t'],
  ['t','s'],
  ['g','t'],
  ['t','g'],
  ['s','c','b','g','t'],
  ['t','b','c','g','s'],
  ['c','t','b','s','g'],
  ['t','s','g','b','c'],
  ['t','s','c','g','b'],
  ['s','c','t','b','g'],
  ['c','s','t','b','g'],
  ['c','b','t','g','s'],
  ['c','t','b','s','g'],
  ['b','s','g','t','c'],
  ['c','b','g','t','s'],
  ['t','c','b','s','g']
];

let scores = { c: 0, g: 0, t: 0, b: 0, s: 0 };
let currentQuestionIndex = 0;
let currentAnswerIndex = 0;

function loadQuestion() {
  const questionDiv = document.getElementById('questions');
  questionDiv.innerText = allQuestions[currentQuestionIndex];
  loadAnswers();
}

function loadAnswers() {
  const answerDiv = document.getElementById('answer');
  const answers = allAnswers[currentQuestionIndex];
  answerDiv.innerText = answers[currentAnswerIndex];
  updateProgressIndicator();
}

function updateProgressIndicator() {
  const progressIndicator = document.getElementById('progress-indicator');
  progressIndicator.innerHTML = '';
  allAnswers[currentQuestionIndex].forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    if (index === currentAnswerIndex) {
      dot.classList.add('active');
    }
    progressIndicator.appendChild(dot);
  });
}

document.getElementById('up-btn').addEventListener('click', () => {
  currentAnswerIndex = (currentAnswerIndex - 1 + allAnswers[currentQuestionIndex].length) % allAnswers[currentQuestionIndex].length;
  loadAnswers();
});

document.getElementById('down-btn').addEventListener('click', () => {
  currentAnswerIndex = (currentAnswerIndex + 1) % allAnswers[currentQuestionIndex].length;
  loadAnswers();
});


document.getElementById('select-btn').addEventListener('click', () => {
  const selectedHouse = houseType[currentQuestionIndex][currentAnswerIndex];
  scores[selectedHouse] += 1;

  if (currentQuestionIndex < allQuestions.length - 1) {
    currentQuestionIndex++;
    currentAnswerIndex = 0; // Reset for next question
    loadQuestion();
  } else {
    displayResult();
  }
});

function loadConfettiScript(houseName) {
  var script = document.createElement('script');
  script.src = `confetti_${houseName.toLowerCase()}.js`;
  document.head.appendChild(script);

  script.onload = function() {
      if(window.confetti) {
          confetti.start(); // Ensure confetti is defined and start it
      }
  };
}

function displayResult() {
  const resultDiv = document.getElementById('result');
  const highestScoreHouse = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  let houseName, houseColor;
  switch(highestScoreHouse) {
    case 'c': houseName = 'Cacklestag'; houseColor = '#1a456e'; break;
    case 'g': houseName = 'Goldynroar'; houseColor = '#6e1a1f'; break;
    case 't': houseName = 'Talonfall'; houseColor = '#371a6e'; break;
    case 'b': houseName = 'Berenheart'; houseColor = '#9f3f1c'; break;
    case 's': houseName = 'Serpentiss'; houseColor = '#0c3d37'; break;
    default: houseName = 'Unknown'; houseColor = '#000000';
  }

  // Set the background color of the result page
  document.body.style.backgroundColor = houseColor;
  document.body.innerHTML = '';  // Clear the existing content

  // Create the HTML structure for the result page
  const resultHTML = `
    <div class="result-container" style="color: white; text-align: center; padding-top: 50px;">
      <img src="./pics/${houseName.toLowerCase()}.png" class="badge-image" alt="${houseName}">
      <h1>${houseName}</h1>
      <p>Congratulations on being claimed by ${houseName}</p>
      <div class="social-share">
        <!-- Icons or text for social media links here -->
      </div>
      <button onclick="restartQuiz()">TRY ANOTHER ONE</button>
      <button onclick="goHome()">HOME</button>
    </div>
  `;

  // Append the new result HTML to the body
  document.body.insertAdjacentHTML('afterbegin', resultHTML);
  
  loadConfettiScript(houseName);
}
// Add the restartQuiz and goHome functions
function restartQuiz() {
  // Reset the quiz to the first question and scores
  currentQuestionIndex = 0;
  currentAnswerIndex = 0;
  scores = { c: 0, g: 0, t: 0, b: 0, s: 0 };
  document.querySelector('.container').style.display = 'flex';
  document.getElementById('result').style.display = 'none';
  loadQuestion();
}

function goHome() {
  // Redirect to the home page or reset the quiz as needed
  window.location.href = 'index.html'; // Replace with the actual path to your home page
}

loadQuestion();
