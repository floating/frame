import { useEffect, useState } from 'react'

const useCountdown = (targetDate) => {
  const countDownDate = new Date(targetDate).getTime()

  const [countDown, setCountDown] = useState(countDownDate - new Date().getTime())

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(countDownDate - new Date().getTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [countDownDate])

  return toString(countDown)
}

const toString = (countdown) => {
  const portions = []

  const msInHour = 1000 * 60 * 60
  const hours = Math.trunc(countdown / msInHour)
  if (hours > 0) {
    portions.push(hours + 'h')
    countdown = countdown - hours * msInHour
  }

  const msInMinute = 1000 * 60
  const minutes = Math.trunc(countdown / msInMinute)
  if (minutes > 0) {
    portions.push(minutes + 'm')
    countdown = countdown - minutes * msInMinute
  }

  const seconds = Math.trunc(countdown / 1000)
  if (seconds > 0) {
    portions.push(seconds + 's')
  }

  return portions.join(' ')
}

export default useCountdown
