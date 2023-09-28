import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import styled from 'styled-components'
import * as d3 from 'd3'

const GraphContainer = styled.div`
  width: 100%;
  height: 300px;
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
`

const TimeframeButton = styled.button`
  background-color: transparent;
  color: ${(props) => (props.active ? 'var(--good)' : 'lightgray')};
  border: none;
  padding: 10px;
  cursor: pointer;
`

const LineGraph = () => {
  const svgRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(585)
  const [timeframe, setTimeframe] = useState('1d')
  const [accountData, setAccountData] = useState({
    '1d': [270, 265, 258, 275, 285, 290, 300, 295, 289, 285, 279, 277],
    '1w': [270, 268, 265, 270, 275, 280, 275, 270, 265, 260, 255, 260, 265],
    '1m': [270, 250, 260, 275, 285, 280, 290, 295, 310, 320, 325, 340],
    '3m': [270, 240, 230, 235, 245, 250, 255, 260, 270, 280, 275, 285],
    ytd: [270, 200, 190, 195, 205, 210, 220, 230, 235, 240, 245, 250],
    '1y': [270, 180, 170, 160, 165, 175, 185, 190, 180, 185, 190, 195],
    all: [270, 150, 140, 145, 155, 165, 175, 185, 195, 205, 215, 225]
  })

  const height = 300

  useLayoutEffect(() => {
    function handleResize() {
      setContainerWidth(svgRef.current.parentElement.offsetWidth)
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const xScale = d3
      .scaleLinear()
      .domain([0, accountData[timeframe].length - 1])
      .range([0, containerWidth])

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(accountData[timeframe]) - 100, d3.max(accountData[timeframe]) + 100])
      .range([height, 0])

    const line = d3
      .line()
      .x((d, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveNatural)

    const path = svg
      .append('path')
      .datum(accountData[timeframe])
      .attr('d', line)
      .attr('stroke', 'var(--good)')
      .attr('stroke-width', 2)
      .attr('fill', 'none')

    const totalLength = path.node().getTotalLength()

    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)
  }, [timeframe, accountData, containerWidth])

  return (
    <div>
      <GraphContainer>
        <svg ref={svgRef} width={containerWidth} height={height}></svg>
      </GraphContainer>
      <ButtonContainer>
        <TimeframeButton active={timeframe === '1d'} onClick={() => setTimeframe('1d')}>
          1D
        </TimeframeButton>
        <TimeframeButton active={timeframe === '1w'} onClick={() => setTimeframe('1w')}>
          1W
        </TimeframeButton>
        <TimeframeButton active={timeframe === '1m'} onClick={() => setTimeframe('1m')}>
          1M
        </TimeframeButton>
        <TimeframeButton active={timeframe === '3m'} onClick={() => setTimeframe('3m')}>
          3M
        </TimeframeButton>
        <TimeframeButton active={timeframe === 'ytd'} onClick={() => setTimeframe('ytd')}>
          YTD
        </TimeframeButton>
        <TimeframeButton active={timeframe === '1y'} onClick={() => setTimeframe('1y')}>
          1Y
        </TimeframeButton>
        <TimeframeButton active={timeframe === 'all'} onClick={() => setTimeframe('all')}>
          All
        </TimeframeButton>
      </ButtonContainer>
    </div>
  )
}

export default LineGraph
