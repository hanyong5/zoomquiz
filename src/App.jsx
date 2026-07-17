import { useEffect, useMemo, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import problems from './data/problem01.json'
import './App.css'

const QUIZ_SIZE = 20
const MOBILE_QUERY = '(max-width: 768px)'

function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function pickQuizSet() {
  return shuffle(problems).slice(0, QUIZ_SIZE)
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return [theme, toggleTheme]
}

function ThemeToggleButton({ theme, onToggle }) {
  return (
    <button
      className="reset-btn"
      onClick={onToggle}
      aria-label="테마 전환"
      title="낮/밤 테마 전환"
    >
      {theme === 'dark' ? '☀️ 낮' : '🌙 밤'}
    </button>
  )
}

function AllQuestionsView({ onBack, theme, onToggleTheme }) {
  const [answers, setAnswers] = useState({})

  function handleSelect(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="app">
      <button className="reset-btn top-left" onClick={onBack}>
        ← 퀴즈로 돌아가기
      </button>

      <div className="top-actions">
        <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
      </div>

      <header className="header">
        <h1>전체 문항 보기</h1>
        <p className="subtitle">
          전체 {problems.length}문항 · 선택하면 바로 정답 확인
        </p>
      </header>

      <ol className="question-list">
        {problems.map((q, index) => {
          const userAnswer = answers[q.id]
          const isCorrect = userAnswer !== undefined && userAnswer === q.answer
          const isWrong = userAnswer !== undefined && userAnswer !== q.answer

          return (
            <li key={q.id}>
              <div
                className={
                  'question-card' +
                  (isCorrect ? ' correct' : '') +
                  (isWrong ? ' wrong' : '')
                }
              >
                <div className="question-index">{index + 1}.</div>
                <div className="question-text">{q.subject}</div>
                <div className="choice-row">
                  <div className="choices">
                    <button
                      className={
                        'choice-btn' + (userAnswer === true ? ' selected' : '')
                      }
                      onClick={() => handleSelect(q.id, true)}
                    >
                      O
                    </button>
                    <button
                      className={
                        'choice-btn' +
                        (userAnswer === false ? ' selected' : '')
                      }
                      onClick={() => handleSelect(q.id, false)}
                    >
                      X
                    </button>
                  </div>
                  {userAnswer !== undefined && (
                    <div
                      className={
                        'answer-feedback' + (isCorrect ? ' correct' : ' wrong')
                      }
                    >
                      정답 {q.answer ? 'O' : 'X'}
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function QuestionCard({ q, index, userAnswer, submitted, onSelect }) {
  const isCorrect = submitted && userAnswer === q.answer
  const isWrong =
    submitted && userAnswer !== undefined && userAnswer !== q.answer
  const isUnanswered = submitted && userAnswer === undefined

  return (
    <div
      className={
        'question-card' +
        (isCorrect ? ' correct' : '') +
        (isWrong ? ' wrong' : '') +
        (isUnanswered ? ' unanswered' : '')
      }
    >
      <div className="question-index">{index + 1}.</div>
      <div className="question-text">{q.subject}</div>
      <div className="choice-row">
        <div className="choices">
          <button
            className={
              'choice-btn' + (userAnswer === true ? ' selected' : '')
            }
            disabled={submitted}
            onClick={() => onSelect(q.id, true)}
          >
            O
          </button>
          <button
            className={
              'choice-btn' + (userAnswer === false ? ' selected' : '')
            }
            disabled={submitted}
            onClick={() => onSelect(q.id, false)}
          >
            X
          </button>
        </div>
        {submitted && (
          <div
            className={
              'answer-feedback' +
              (isCorrect ? ' correct' : '') +
              (isWrong ? ' wrong' : '')
            }
          >
            정답 {q.answer ? 'O' : 'X'}
            {isUnanswered && ' (미응답)'}
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  const isMobile = useIsMobile()
  const [theme, toggleTheme] = useTheme()
  const swiperRef = useRef(null)
  const [view, setView] = useState('quiz')
  const [quiz, setQuiz] = useState(() => pickQuizSet())
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const totalScore = useMemo(
    () => quiz.reduce((sum, q) => sum + q.score, 0),
    [quiz]
  )

  const earnedScore = useMemo(() => {
    if (!submitted) return 0
    return quiz.reduce(
      (sum, q) => sum + (answers[q.id] === q.answer ? q.score : 0),
      0
    )
  }, [submitted, quiz, answers])

  const correctCount = useMemo(() => {
    if (!submitted) return 0
    return quiz.filter((q) => answers[q.id] === q.answer).length
  }, [submitted, quiz, answers])

  const answeredCount = Object.keys(answers).length

  function handleSelect(id, value) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function handleSubmit() {
    setSubmitted(true)
  }

  function handleRestart() {
    setQuiz(pickQuizSet())
    setAnswers({})
    setSubmitted(false)
    swiperRef.current?.slideTo(0, 0)
  }

  if (view === 'all') {
    return (
      <AllQuestionsView
        onBack={() => setView('quiz')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <div className="app">
      <button
        className="reset-btn top-left"
        onClick={() => setView('all')}
      >
        ☰ 전체 문항보기
      </button>

      <div className="top-actions">
        <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
        <button
          className="reset-btn"
          onClick={handleRestart}
          aria-label="문제 초기화"
          title="새 문제로 초기화"
        >
          ⟲ 초기화
        </button>
      </div>

      <header className="header">
        <h1>O/X 퀴즈</h1>
        <p className="subtitle">
          전체 {problems.length}문항 중 랜덤 {QUIZ_SIZE}문항
        </p>
      </header>

      {submitted && (
        <div className="result-banner">
          <div className="result-score">
            {earnedScore} / {totalScore}점
          </div>
          <div className="result-detail">
            {correctCount} / {quiz.length}문제 정답
          </div>
          <button className="btn btn-primary" onClick={handleRestart}>
            새 문제 풀기
          </button>
        </div>
      )}

      {isMobile ? (
        <>
          <Swiper
            modules={[Pagination]}
            pagination={{ type: 'fraction' }}
            spaceBetween={16}
            className="quiz-swiper"
            onSwiper={(swiper) => {
              swiperRef.current = swiper
            }}
          >
            {quiz.map((q, index) => (
              <SwiperSlide key={q.id}>
                <QuestionCard
                  q={q}
                  index={index}
                  userAnswer={answers[q.id]}
                  submitted={submitted}
                  onSelect={handleSelect}
                />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="swiper-nav-buttons">
            <button
              className="btn btn-nav"
              onClick={() => swiperRef.current?.slidePrev()}
            >
              ← 이전
            </button>
            <button
              className="btn btn-nav"
              onClick={() => swiperRef.current?.slideNext()}
            >
              다음 →
            </button>
          </div>
        </>
      ) : (
        <ol className="question-list">
          {quiz.map((q, index) => (
            <li key={q.id}>
              <QuestionCard
                q={q}
                index={index}
                userAnswer={answers[q.id]}
                submitted={submitted}
                onSelect={handleSelect}
              />
            </li>
          ))}
        </ol>
      )}

      {!submitted && (
        <div className="submit-bar">
          <span className="progress-text">
            {answeredCount} / {quiz.length}문항 응답
          </span>
          <button
            className="btn btn-primary"
            disabled={answeredCount === 0}
            onClick={handleSubmit}
          >
            채점하기
          </button>
        </div>
      )}
    </div>
  )
}

export default App
