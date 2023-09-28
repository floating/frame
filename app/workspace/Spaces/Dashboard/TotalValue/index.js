import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  text-align: center;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'VCR';
`

const AccountValue = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
`

const Value = styled.div`
  font-size: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Percent = styled.div`
  font-size: 16px;
  margin-left: 16px;
  color: ${(props) => props.color};
  display: flex;
  justify-content: center;
  align-items: center;
`

const startValue = 250000

const App = () => {
  const [accountValue, setAccountValue] = useState(startValue)
  const [targetAccountValue, setTargetAccountValue] = useState(startValue)
  const [percentChange, setPercentChange] = useState(0)
  const [color, setColor] = useState('var(--outerspace)')

  useEffect(() => {
    const updateValue = () => {
      const randomChange = Math.floor(Math.random() * 2000) - 1000
      const newAccountValue = accountValue + randomChange

      setTargetAccountValue(newAccountValue)

      const startTime = Date.now()
      const duration = 2000
      const initialAccountValue = accountValue

      const interval = setInterval(() => {
        const currentTime = Date.now()
        const elapsedTime = currentTime - startTime

        if (elapsedTime > duration) {
          clearInterval(interval)
          setAccountValue(targetAccountValue)
          return
        }

        const t = elapsedTime / duration
        const easeOutT = t * (2 - t)
        const newValue = initialAccountValue + easeOutT * (targetAccountValue - initialAccountValue)

        const newPercentChange = ((newValue - startValue) / startValue) * 100

        setAccountValue(newValue)
        setPercentChange(newPercentChange.toFixed(2))

        if (newPercentChange > 0) {
          setColor('var(--good)')
        } else if (newPercentChange < 0) {
          setColor('var(--bad)')
        }
      }, 50)

      return () => clearInterval(interval)
    }

    const mainInterval = setInterval(updateValue, 5000)

    return () => clearInterval(mainInterval)
  }, [accountValue, targetAccountValue])

  return (
    <Container>
      <AccountValue>
        <Value>
          <span style={{ paddingRight: '4px', fontSize: '16px' }}>$</span>
          {Math.floor(accountValue).toLocaleString()}
        </Value>
        <Percent color={color}>
          {percentChange}
          <span style={{ paddingLeft: '4px', fontSize: '12px' }}>%</span>
        </Percent>
      </AccountValue>
    </Container>
  )
}

export default App
