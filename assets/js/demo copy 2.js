
//Chart
// var ctx = document.getElementById('statisticsChart').getContext('2d');



var ctx = document.getElementById('statisticsChart').getContext('2d');

var statisticsChart = new Chart(ctx, {
	type: 'line',
	data: {
		labels: [], // dynamically filled later
		datasets: [
			{
				label: "Distance (cm)",
				borderColor: '#177dff',
				pointBackgroundColor: 'rgba(23, 125, 255, 0.6)',
				pointRadius: 2,
				backgroundColor: 'rgba(23, 125, 255, 0.4)',
				legendColor: '#177dff',
				fill: true,
				borderWidth: 2,
				data: [] // Data will be updated dynamically
				// data: [] // Data will be updated dynamically
			}
		]
	},
	options : {
		responsive: true, 
		maintainAspectRatio: false,
		legend: { display: true },
		tooltips: {
			bodySpacing: 4,
			mode: "nearest",
			intersect: 0,
			position: "nearest",
			xPadding: 10,
			yPadding: 10,
			caretPadding: 10
		},
		layout: {
			padding: { left:5, right:5, top:15, bottom:15 }
		},
		scales: {
			yAxes: [{
				ticks: {
					fontStyle: "500",
					beginAtZero: true,
					maxTicksLimit: 5,
					padding: 10
				},
				gridLines: {
					drawTicks: false,
					display: false
				}
			}],
			xAxes: [{
				gridLines: {
					zeroLineColor: "transparent"
				},
				ticks: {
					padding: 10,
					fontStyle: "500"
				}
			}]
		},
		legendCallback: function(chart) { 
			var text = []; 
			text.push('<ul class="' + chart.id + '-legend html-legend">'); 
			for (var i = 0; i < chart.data.datasets.length; i++) { 
				text.push('<li><span style="background-color:' + chart.data.datasets[i].legendColor + '"></span>'); 
				if (chart.data.datasets[i].label) { 
					text.push(chart.data.datasets[i].label); 
				} 
				text.push('</li>'); 
			} 
			text.push('</ul>'); 
			return text.join(''); 
		}  
	}
});


// Speedometer chart

var gaugeChart = new Chart(document.getElementById("gaugeChart"), {
  type: 'gauge',
  data: {
    datasets: [{
      value: 30, // Initial value
      minValue: 0,
      data: [0, 20, 40, 60, 80, 100],
      backgroundColor: ['#ff0000', '#ff9900', '#ffff00', '#99cc00', '#00cc00'],
    }]
  },
  options: {
    responsive: true,
    needle: {
      radiusPercentage: 2,
      widthPercentage: 3.2,
      lengthPercentage: 80,
      color: 'black'
    },
    valueLabel: {
      display: true,
      formatter: (value) => value + " cm"
    }
  }
});

function updateGauge(value) {
  gaugeChart.data.datasets[0].value = value;
  gaugeChart.update();
}

// ⏱️ Poll every second for new distance data
setInterval(async () => {
	try {
		const response = await fetch("http://localhost:5000/api/distance");
		const json = await response.json();

		// Defensive check
		if (!json || json.distance_cm === undefined) {
			throw new Error("Invalid API response: " + JSON.stringify(json));
		}

		const distance = parseFloat(json.distance_cm);
		const now = new Date().toLocaleTimeString();

		statisticsChart.data.labels.push(now);
		statisticsChart.data.datasets[0].data.push(distance);

		// Keep last 20 points
		if (statisticsChart.data.labels.length > 20) {
			statisticsChart.data.labels.shift();
			statisticsChart.data.datasets[0].data.shift();
		}

		statisticsChart.update();
		updateGauge(distance)
	} catch (error) {
		console.error("Failed to fetch data:", error);
	}
}, 1000);

var myLegendContainer = document.getElementById("myChartLegend");

// generate HTML legend
myLegendContainer.innerHTML = statisticsChart.generateLegend();

// bind onClick event to all LI-tags of the legend
var legendItems = myLegendContainer.getElementsByTagName('li');
for (var i = 0; i < legendItems.length; i += 1) {
	legendItems[i].addEventListener("click", legendClickCallback, false);
}





<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>