import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// reading in CSV file
async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
      }));
    
      return data;
  }
  
let xScale = d3.scaleLinear().domain([0, 24]).range([50, 0]);
let yScale = d3.scaleLinear().domain([0, 24]).range([50, 0]);
function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
          configurable: false,
          writable: false,
          enumerable: true
        });
  
        return ret;
      });
  }


function renderCommitInfo(data, commits){
    // create dl element
    const dl = d3.select("#stats").append("dl").attr(
        'class', 'stats'
    );

    // add total LOC 
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    // add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // number of files
    const numFiles  = d3.group(data, d => d.file).size
    dl.append('dt').text('Number of Files');
    dl.append('dd').text(numFiles);

    //time when most work is done
    const workByPeriod = d3.rollups(
        data,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
      );
    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    dl.append('dt').text('Time of Day when Most Work Done');
    dl.append('dd').text(maxPeriod);

}

let data = await loadData();
let commits = processCommits(data);
console.log(commits);

renderCommitInfo(data, commits);

// step 2 below: visualizing time and day of commits in a scatterplot
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.time;
  author.textContent = commit.author;
  lines.textContent = commit.lines.length;


}


function renderScatterPlot(data, commits){
    // defining the size of our chart
    const width = 1000;
    const height = 600;
    
    // creating the svg in the correct tag using D3 (appending SVG to chart div tag)
    const svg = d3
        .select("#chart")
        .append('svg')
        .attr("viewBox",`0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    // want to make our x and y scale
    // y scale = standard linear scale (0 to 24 representing the 24 hours in a day)
    // x scale is a time scale to handle datetime data automatically
    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

     // now we need to add our axes

     const margin = {top: 10, right: 10, bottom: 30, left: 20};
     const usableArea = {
         top: margin.top,
         right: width - margin.right,
         bottom: height - margin.bottom,
         left: margin.left,
         width: width - margin.left - margin.right,
         height: height - margin.top - margin.bottom,
     };

     // Add gridlines BEFORE the axes
const gridlines = svg
.append('g')
.attr('class', 'gridlines')
.attr('transform', `translate(${usableArea.left}, 0)`);

// Create gridlines as an axis with no labels and full-width ticks
gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
 
     // updating the scale of our x and y with the new ranges
     xScale.range([usableArea.left, usableArea.right]);
     yScale.range([usableArea.bottom, usableArea.top]);
 
     //now we can create the axes
     const xAxis = d3.axisBottom(xScale);
    //  const yAxis = d3.axisLeft(yScale);
     const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
 
     // appending the X axis to the SVG
     svg
         .append('g')
         .attr('transform', `translate(0, ${usableArea.bottom})`)
         .call(xAxis)
     // appending the y axis to the SVG
     svg
         .append('g')
         .attr('transform', `translate(${usableArea.left}, 0)`)
         .call(yAxis);
 
    // adding circles, these are our points on the scatterplot
    // want to make the axes before we add the dots because we want to make sure that the range of the axis scale is correct
    const dots = svg.append('g').attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    
    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'pink')
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
          renderTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mouseleave', () => {
          updateTooltipVisibility(false);
          
        });

    createBrushSelector(svg)
    




}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
  
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }

  const [x0, x1] = selection.map((d) => d[0]);
  const [y0, y1] = selection.map((d) => d[1]);

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}


renderScatterPlot(data, commits)

