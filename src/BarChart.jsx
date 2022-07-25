import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { axisBottom, axisLeft } from 'd3';
import useWindowSize from './useWindowSize';
import styled from 'styled-components';

const StyledContainer = styled.main`
  display: flex;
`;

function BarChart({ data }) {
  const chartData = data;

  // Set the dimensions and margins of the graph
  const size = useWindowSize();

  const margin = { right: 10, bottom: 150, top: 80, left: 140 };
  const height = size.height - margin.top - margin.bottom;
  const width = size.width - margin.right - margin.left;

  // UseRef hook to specify where to place the d3 chart
  const chartRef = useRef(null);

  useEffect(() => {
    // Extract measure and dimension qlik data to define the domain and scales
    const minData = chartData.map((item) => item[2].qNum);
    const maxData = chartData.map((item) => item[3].qNum);
    const dimensionData = chartData.map((item) => item[0].qText);
    const myDomain = [d3.min(minData), d3.max(maxData)];

    // Define scales for x and y axis
    const yScale = d3
      .scaleLinear()
      .range([height, 0])
      .domain(myDomain)
      .nice();
    const xScale = d3
      .scaleBand()
      .range([margin.left, width])
      .domain(dimensionData);

    // Create padding between each value for the bars
    xScale.padding(0.45);

    // Add x and y axes
    const yAxis = axisLeft(yScale)
      .ticks(5)
      .tickSize(-width)
      .tickPadding(10)
      .tickSizeOuter(0)
      .tickFormat((d) => `${d / 1000}K`);
    const xAxis = axisBottom(xScale)
      .tickSizeOuter(0)
      .tickSize(0)
      .tickPadding(15)
      .tickFormat((d) => `${d.slice(0, 4)}${d.slice(6)}`);

    // Set dimensions of the svg chart
    d3.select(chartRef.current)
      .attr('width', width)
      .attr('height', height + margin.bottom)
      .attr('viewBox', [0, 0, width, height + margin.bottom])
      .attr('style', 'max-width: 100%; height: auto;');

    // Apply y axis
    d3.select(chartRef.current)
      .select('.yAxis')
      .attr('transform', `translate(${margin.left}, ${margin.top} )`)
      .call(yAxis)
      .style('stroke-opacity', '0.2')
      .style('font', '14px sans-serif')
      .select('path')
      .attr('transform', `translate(10, 0)`);

    // Apply x axis with extended ticks
    d3.select(chartRef.current)
      .select('.xAxis')
      .attr('transform', `translate(0, ${height + margin.top} )`)
      .transition()
      .duration(0)
      .call(xAxis)
      .style('font', '14px sans-serif')
      .selectAll('text');

    // Define bars
    const bars = d3
      .select(chartRef.current)
      .select('.bars')
      .selectAll('rect')
      .data(chartData);

    // Add bars
    bars
      .enter()
      .append('rect')
      .attr('transform', `translate(0, ${margin.top} )`)
      .attr('fill', '#6d8ea6')
      .attr('width', xScale.bandwidth())
      .attr('x', (d, i) => xScale(d[0].qText))
      .attr('y', (d) => yScale(0))
      .attr('height', 0)
      .transition()
      .duration(0)
      .attr('y', (d) => yScale(d[1].qNum))
      .attr('height', (d) => Math.abs(yScale(d[1].qNum) - yScale(0)));
    // .delay((d, i) => i * 30);

    // exit
    bars
      .exit()
      .transition()
      .duration(0)
      .attr('height', (d) => 0)
      .remove();

    // update
    bars
      .attr('width', xScale.bandwidth())
      .attr('x', (d, i) => xScale(d[0].qText))
      .transition()
      .duration(1000)
      .attr('width', xScale.bandwidth())
      .attr('x', (d, i) => xScale(d[0].qText))
      .attr('y', (d) => yScale(d[1].qNum))
      .attr('height', (d) => Math.abs(yScale(d[1].qNum) - yScale(0)));

    // create line definition
    const line = d3
      .line()
      .x((d) => xScale(d[0].qText) + xScale.bandwidth() / 2)
      .y((d) => yScale(d[4].qNum));

    // apply rolling average line
    d3.select(chartRef.current)
      .select('.line')
      .attr('fill', 'none')
      .attr('transform', `translate(8, ${margin.top} )`)
      .attr('stroke', 'red')
      .attr('stroke-width', 3)
      .attr('class', 'line')
      .attr('stroke-dashoffset', 1000)
      .attr('stroke-dasharray', 1000)
      .attr('d', line(chartData.slice(2)))
      .transition()
      .duration(0)
      .attr('stroke-dashoffset', 0);
    // .attr('stroke-dasharray', 0);

    // create/draw the error bar symbol function
    const errorBar = (d) => {
      return (context, size) => {
        return {
          draw(context, size) {
            // the min part of whisker
            const lci =
              (yScale(d[2].qNum) - yScale(d[1].qNum)) * size;

            // the max part of the whisker
            const uci =
              (yScale(d[3].qNum) - yScale(d[1].qNum)) * size;

            context.moveTo(0, uci);
            context.lineTo(0, lci);
            context.moveTo(-5, lci);
            context.lineTo(5, lci);
            context.moveTo(-5, uci);
            context.lineTo(5, uci);
          },
        };
      };
    };

    // apply the whisker plots
    d3.select(chartRef.current)
      .selectAll('path.error-bar')
      .data(chartData)
      .join('path')
      .classed('error-bar', true)
      .attr(
        'transform',
        (d) =>
          `translate(${
            xScale(d[0].qText) + xScale.bandwidth() / 2
          }, ${yScale(d[1].qNum) + margin.top})`,
      )
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('d', (d) => d3.symbol(errorBar(d)).size(0)())
      .transition()
      .duration(0)
      .delay(0)
      .attr('d', (d) => d3.symbol(errorBar(d)).size(1)());

    // Add label for the x axis
    d3.select(chartRef.current)
      .select('.xLabel')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'start')
      .attr('font-size', '1.2rem')
      .attr('font-weight', '500')
      .attr('font-family', 'sans-serif')
      .text('Date');

    // Add label for the y axis
    d3.select(chartRef.current)
      .select('.yLabel')
      .attr('x', -height / 1.4)
      .attr('y', margin.left / 3)
      .attr('text-anchor', 'start')
      .attr('font-size', '1.2rem')
      .attr('font-weight', '500')
      .attr('transform', 'rotate(-90)')
      .style('text-anchor', 'middle')
      .attr('font-family', 'sans-serif')
      .text('Balances');

    // keys for legend
    const legendKeys = [
      'Average balance',
      '3 month rolling average',
      'Min/max',
    ];

    // add legend symbol for the bars
    d3.select(chartRef.current)
      .select('.legend')
      .append('rect')
      .attr('transform', `translate(0, ${margin.top} )`)
      .attr('fill', '#6d8ea6')
      .attr('x', 50)
      .attr('y', -40)
      .attr('height', '10')
      .attr('width', '10');

    // add legend symbol for the red line
    d3.select(chartRef.current)
      .select('.legend')
      .append('rect')
      .attr('transform', `translate(0, ${margin.top} )`)
      .attr('fill', '#db0a0a')
      .attr('x', 205)
      .attr('y', -37)
      .attr('height', '3')
      .attr('width', '15');

    //add legend symbol for eror lines
    d3.select(chartRef.current)
      .select('.legend')
      .append('rect')
      .attr('transform', `translate(0, ${margin.top} )`)
      .attr('fill', '#000000')
      .attr('x', 410)
      .attr('y', -37)
      .attr('height', '3')
      .attr('width', '15');

    // add legend text
    d3.select(chartRef.current)
      .select('.legend')
      .selectAll('text')
      .data(legendKeys)
      .join('text')
      .text((d) => d)
      .attr('y', 50)
      .attr('x', (d, i) => {
        if (i === 1) {
          return i * 155 + 70;
        }
        return i * 180 + 70;
      })
      .attr('font-family', 'sans-serif');
  }, [chartData, margin.left, margin.top, height, width]);

  return (
    <StyledContainer>
      <svg ref={chartRef}>
        <g className='xAxis' />
        <g className='yAxis' />
        <g className='bars' />
        <g className='legend' />
        <path className='line' />
        <text className='xLabel' />
        <text className='yLabel' />
      </svg>
    </StyledContainer>
  );
}

export default BarChart;
