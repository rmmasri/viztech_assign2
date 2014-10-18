//Assignment 2
//Due Wednesday October 15 at 5:00PM
//Determine the size of the plot, as well as the margins
//This part is already done, but you should feel free to tweak these margins
var margin = {t: 150, r: 50, b: 150, l: 100},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b;


//Set up SVG drawing elements -- already done
var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform', 'translate(' + margin.l + ',' + margin.t + ')');

/* Task 2.4
 *
 * Draw axes
 * Consult the readme document
 *
 */
var scales = {};
scales.x = d3.scale.log().range([0, width]);
scales.y = d3.scale.linear().range([height, 0]);
scales.pop = d3.scale.sqrt().domain([0, 1.3e9]).range([0, 50]);

var xAxis = d3.svg.axis()
    .scale(scales.x)
    .tickSize(-height, 0)
    .tickFormat(d3.format(",d"))/* comma uses comma separators and the d is integer*/
    .tickValues([1000, 2000, 10000, 20000, 30000, 40000])
    .orient("bottom");
var yAxis = d3.svg.axis()
    .scale(scales.y)
    .tickSize(6, 0)
    .orient("left");

/* Task 2.1
 * Load data using d3.csv()
 * Consult documentation here: https://github.com/mbostock/d3/wiki/CSV
 * recall the syntax is d3.csv(url[, accessor][, callback]), where assessor and callback are both functions
 * YOU WILL NEED TO WRITE THE ASSESSOR FUNCTION
 *
 * HINT:
 * d3.csv("data/world_bank_2010.csv", function(d){ ... }, function(error, rows){ ... }
 *
 *
 */
d3.csv("data/world_bank_2010.csv",
    //accessor function
    function parse(d) {
        //console.log(d);
        return{
            country: d.Country,
            gdp: (d["GDP (constant 2005 US$)"] == "..") ? undefined : +d["GDP (constant 2005 US$)"],
            //+coerces it into a number
            gdpPerCap: (d["GDP per capita (constant 2005 US$)"] == "..") ? undefined : +d["GDP per capita (constant 2005 US$)"],
            pop: (d["Population, total"] == "..") ? undefined : +d["Population, total"],
            life: (d["Life expectancy at birth, female (years)"] == "..") ? undefined : +d["Life expectancy at birth, female (years)"],
            literacy: (d["Literacy rate, adult total (% of people ages 15 and above)"] == "..") ? undefined : +d["Literacy rate, adult total (% of people ages 15 and above)"],
            malnutrition: (d["Malnutrition prevalence, weight for age (% of children under 5)"] == "..") ? undefined : +d["Malnutrition prevalence, weight for age (% of children under 5)"],
            hospitalBeds: (d["Hospital beds (per 1,000 people)"] == "..") ? undefined : +d["Hospital beds (per 1,000 people)"],
            healthExp: (d["Health expenditure, total (% of GDP)"] == "..") ? undefined : +d["Health expenditure, total (% of GDP)"]
        };

        console.log(rows);
    },
    //callback function
    function (error, rows) {
        if (error) {
            //error handling
        }

        //Mining min and max
        var minX = d3.min(rows, function (d) {
//                return d.["gdpPerCap"];
                return d.gdpPerCap;

            }),
            maxX = d3.max(rows, function (d) {
                return d.gdpPerCap;
            });

        //Mining min and max
        var minY = d3.min(rows, function (d) {
                return d.life;
            }),
            maxY = d3.max(rows, function (d) {
                return d.life;
            });

        //console.log(minY, maxY);


        /* Task 2.3
         * Mapping domain to range
         * Consult the readme document
         *
         */
        scales.x.domain([minX * 0.9, maxX * 1.1])
        scales.x.domain([minX * 0.9, maxX * 1.1])
        var medGdpPerCap = d3.median(rows, function (d) {
            return d.gdp
        });

        var meanGdpPerCap = d3.sum(rows, function (d) {
            return d.gdp
        });
        xAxis.tickValues().push(meanGdpPerCap);

        draw(rows);
    });

/* Task 2.2
 * Once data is loaded, call the draw() function
 * YOU WILL NEED TO WRITE THE DRAW FUNCTION
 * The draw() function expects one argument, which is the array object representing the full dataset
 *
 * HINT:
 * function draw(rows){ ... }
 *
 */
function draw(rows) {
    svg.append('g')
        .attr('class', 'axis x')
        .attr('transform', 'translate(' + 0 + ',' + height + ')')
        .call(xAxis);
    svg.append('g')
        .attr('class', 'axis y')
        .call(yAxis);


    //var gdpPerCapitaMax = 100, gdpPerCapitaMin = 0;
    var countries = svg.selectAll('.country')
        .data(rows, function (d) {
            return d.country;
        })
        .enter()
        .append('g')/*for each empty placeholder*/
        .attr('class', function (d) {
            return d.country + " country";
        });
    countries
        //return only countries with both gdpPerCap and Life Expectancy defined
        .filter(function (d) {
            return d.gdpPerCap && d.life;
        })
        .sort(function (a, b) {
            return b.pop - a.pop;
        })
        .attr('transform', function (d) {
            return "translate(" + scales.x(d.gdpPerCap) + "," + scales.y(d.life) + ")";
        })
        .append('circle')
        .attr('r', function (d) {
            return scales.pop(d.pop);
        });
}

