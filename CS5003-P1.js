document.addEventListener('DOMContentLoaded', () => {

  // Get page elements
  const startBtn = document.querySelector('.start-btn')
  const restartBtn = document.querySelector('.restart-btn')
  const quitBtn = document.querySelector('.quit-btn')
  const quizContainer = document.querySelector('#quiz-container')

  // initialize variable
  let score = 0
  let wrongAnswers = 0
  let questions = []
  let countdown

  // Set the function for starting the game
  function setupGame() {
    score = 0
    wrongAnswers = 0
    questions = []
    startBtn.style.display = 'none'
    restartBtn.style.display = 'inline'
    quitBtn.style.display = 'inline'
    getQuestions()
  }
  // Event listening for start, restart and quit buttons
  startBtn.addEventListener('click', setupGame)
  restartBtn.addEventListener('click', setupGame) // The restart button restarts the game
  quitBtn.addEventListener('click', () => {
    showGameResult(true) // The user chooses to exit and displays the game results
  })

  // Get the asynchronous function of the question from the API
  async function getQuestions() {
    try {
      const apiUrl = 'https://opentdb.com/api.php?amount=10&type=multiple'
      const response = await fetch(apiUrl)
      const data = await response.json()
      questions = data.results.map(questionItem => ({
        question: questionItem.question,
        answers: [...questionItem.incorrect_answers, questionItem.correct_answer].sort(() => 0.5 - Math.random()), //answers in random order
        correctAnswer: questionItem.correct_answer,
        difficulty: questionItem.difficulty,// add questions' difficulty
      }))
      showQuestion(0) // Show the first question
    } catch (error) {
      console.error('Failed to fetch questions:', error)
      quizContainer.innerHTML = `<p>Error loading questions. Please try again later.</p>`
    }
  }
  /* 
  Quoted from the following URL:
  https://stackoverflow.com/questions/7394748/whats-the-right-way-to-decode-a-string-that-has-special-html-entities-in-it/7394787#7394787
  A function that decodes HTML entities
   */
  function decodeHtml(html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }
  // This function is to avoid timing logic to continue executing when the element is not in the DOM
  function countNow(timer) {
    const timerexist = document.querySelector('#countdown-timer')
    // Check if the timer element exists
    if (timerexist) {
      // If the timer element exists, update its text content to show the remaining time
      timerexist.textContent = `Time Left: ${timer} seconds`
    } else {
      // If the element is not found, clear the timer
      clearInterval(countdown);
    }
  }

  function startCountdown(duration, index) {
    let timer = duration //Set initial timer duration
    countNow(timer) //First call to immediately display the timer
    countdown = setInterval(function () {
      timer-- //Reduce one second per call
      countNow(timer)
      //Check if time has run out
      if (timer < 0) {
        clearInterval(countdown)
        wrongAnswers++
        if (wrongAnswers >= 3) {
          showGameResult(false)
        } else {
          showQuestion(index + 1)
        }
      }
    }, 1000)
  }

  function showQuestion(index) {
    clearInterval(countdown) //clear count down timer
    if (index < questions.length) {
      const currentQuestion = questions[index]
      const decodedQuestion = decodeHtml(currentQuestion.question)
      const difficulty = currentQuestion.difficulty
      quizContainer.innerHTML = `
        <div class="question">
        <h3>${decodedQuestion}</h3>
        <p id="question-difficulty">Difficulty: ${difficulty}</p>
        <p id="countdown-timer"></p>
        </div>` // Use the decoded question text
      const answersEl = document.createElement('div')
      currentQuestion.answers.forEach(answer => {
        const button = document.createElement('button')
        button.textContent = decodeHtml(answer) // Decode the answers
        button.addEventListener('click', () => selectAnswer(answer, currentQuestion.correctAnswer, index))
        answersEl.appendChild(button)
      })
      quizContainer.appendChild(answersEl)
      startCountdown(30, index)
    } else {
      showGameResult(false) // All questions answered, show the game results
    }
  }

  // A function that selects an answer and processes the score
  function selectAnswer(selectedAnswer, correctAnswer, index) {
    clearInterval(countdown)
    const difficulty = questions[index].difficulty
    let scoreIncrement = 0
    if (difficulty === "easy") scoreIncrement = 1
    else if (difficulty === "medium") scoreIncrement = 2
    else if (difficulty === "hard") scoreIncrement = 3
    // calculate score according to difficulty
    if (selectedAnswer === correctAnswer) {
      score += scoreIncrement
    } else {
      wrongAnswers++
      if (wrongAnswers >= 3) {
        showGameResult(false) // When the wrong answer reaches 3 times, the game is over
        return
      }
    }
    showQuestion(index + 1) // Show the next question
  }

  // A function that displays the results of the game
  function showGameResult(quit) {
    const resultMessage = quit ? `<h2>You Win!</h2> <p>Your score is: ${score}</p>` : `<h2>Game Over</h2> <p>Your score is: ${score}<p>`
    quizContainer.innerHTML = `<h2>${resultMessage}</h2>`
    // Reset button state, allowing game to be restarted
    restartBtn.style.display = 'none'
    quitBtn.style.display = 'none'
    startBtn.style.display = 'inline'
  }
})
