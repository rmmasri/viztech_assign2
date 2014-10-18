//Assignment 2
//Due Wednesday October 15 at 5:00PM

//Determine the size of the plot, as well as the margins
//This part is already done, but you should feel free to tweak these margins
var margin = {t:150,r:50,b:150,l:100},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b;


//Set up SVG drawing elements -- already done
var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//Scales
var scales = {};
    scales.x = d3.scale.log().range([0,width]);
    scales.y = d3.scale.linear().range([height,0]);
    scales.pop = d3.scale.sqrt().domain([0,1.3e9]).range([0,50]);
    scales.color = d3.scale.ordinal().range([
        "#97D8E8",
        "#F57F26",
        "#03afeb",
        "#D6E37C",
        "#73C485",
        "#53C2BB",
        "#B3479A",
        "#FFF200",
        "#F05044",
        "#ED1E2E"
    ]);

//SVG generator for axes
var xAxis = d3.svg.axis()
    .scale(scales.x)
    .tickSize(-height,0) //second argument suppresses domain path
    .tickFormat(d3.format(",d"))
    .tickValues([1000,5000,10000,20000,30000,40000])
    .orient("bottom");
var yAxis = d3.svg.axis()
    .scale(scales.y)
    .tickSize(6,0)
    .orient("left");

//d3.map to store metadata
var metadataMap = d3.map();

//variables to store current query selection
var xQuery = "gdpPerCap",
    yQuery = "life";

//variables to store d3 selections
var countryNodes;


queue()
    .defer(d3.csv,"data/world_bank_2010.csv",parse)
    .defer(d3.csv,"data/metadata.csv",parseMeta)
    .await(dataLoaded);


function dataLoaded(error,rows,meta){

    //populate popup menus
    var xAxisMenu = d3.select('.control #x .dropdown-menu'),
        yAxisMenu = d3.select('.control #y .dropdown-menu');
    for(key in rows[0]){
        xAxisMenu.append('li')
            .attr("id",key)
            .append('a')
            .attr("href","#")
            .text(key);
        yAxisMenu.append('li')
            .attr("id",key)
            .append('a')
            .attr("href","#")
            .text(key);
    }

    //Mine metadata
    var regions = d3.nest()
        .key(function(d){ return d.region;})
        .map(meta,d3.map)
        .keys();
    var incomeGroups = d3.nest()
        .key(function(d){ return d.incomeGroup})
        .map(meta,d3.map)
        .keys();

    //Mining max and min
    var minX = d3.min(rows, function(d){ return d.gdpPerCap; }),
        maxX = d3.max(rows, function(d){ return d.gdpPerCap });
    //this does the same thing, but faster
    var minY = d3.min(rows, function(d){ return d.life; }),
        maxY = d3.max(rows, function(d){ return d.life; });

    //Scale domain
    scales.x.domain([minX*0.9,maxX*1.1]);
    scales.y.domain([minY*0.9,maxY*1.1]);
    scales.color.domain(incomeGroups);

    //call the draw function
    draw(rows);
}


function draw(rows){

    //runs exactly once

    svg.append('g')
        .attr('class','axis x')
        .attr('transform','translate('+0+','+height+')')
        .call(xAxis);
    svg.append('g')
        .attr('class','axis y')
        .call(yAxis);

    countryNodes = svg.selectAll('.country')
        .data(rows, function(d){
            return d.country;
        })
        .enter()
        .append('g')
        .attr('class',function(d){
            return d.country + " country";
        });
    countryNodes
        .filter(function(d){
            return d[xQuery] && d[yQuery];
        })
        .sort(function(a,b){
            //puts bigger circles at the bottom
            return b.pop - a.pop;
        })
        .attr('transform',function(d){
            return "translate("+scales.x(d[xQuery])+","+scales.y(d[yQuery])+")";
        });
    countryNodes.append('circle');

    redraw();

    //listen to xQuery and yQuery change
    $('.control #x .dropdown-menu li').on('click',function(e){
        e.preventDefault();
        xQuery = $(this).attr('id');
        queryChange(rows);
    });
    $('.control #y .dropdown-menu li').on('click',function(e){
        e.preventDefault();
        yQuery = $(this).attr('id');
        queryChange(rows);
    });
}

function redraw(){
    d3.select('.x.axis')
        .transition()
        .call(xAxis);
    d3.select('.y.axis')
        .transition()
        .call(yAxis);

    countryNodes
        .filter(function(d){
            return d[xQuery] && d[yQuery];
        })
        .sort(function(a,b){
            //puts bigger circles at the bottom
            return b.pop - a.pop;
        })
        .on('mouseenter',onMouseEnter)
        .on('mouseleave',onMouseLeave)
        .transition()
        .attr('transform',function(d){
            return "translate("+scales.x(d[xQuery])+","+scales.y(d[yQuery])+")";
        })
        .selectAll('circle')
        .attr('r', function(d){
            return scales.pop(d.pop);
        })
        .style('fill',function(d){
            if(!metadataMap.get(d.country)){
                console.log(d.country);
                return null;
            }
            return scales.color(metadataMap.get(d.country).incomeGroup);
        });
    countryNodes
        .filter(function(d){
            return !(d[xQuery] && d[yQuery])
        })
        .transition()
        .selectAll('circle')
        .attr('r',0);
}

function queryChange(rows){
    //recalculate scales
    var minX = d3.min(rows, function(d){ return d[xQuery]; }),
        maxX = d3.max(rows, function(d){ return d[xQuery] });
    //this does the same thing, but faster
    var minY = d3.min(rows, function(d){ return d[yQuery]; }),
        maxY = d3.max(rows, function(d){ return d[yQuery]; });

    scales.x.domain([minX*0.9,maxX*1.1]);
    scales.y.domain([minY*0.9,maxY*1.1]);
    //scales.color.domain(regions);

    redraw();

}

function parse(d){
    return {
        country: d.Country,
        gdp: (d["GDP (constant 2005 US$)"]=="..") ? undefined:+d["GDP (constant 2005 US$)"],
        gdpPerCap: (d["GDP per capita (constant 2005 US$)"]=="..")? undefined:+d["GDP per capita (constant 2005 US$)"],
        pop: (d["Population, total"]=="..")?undefined:+d["Population, total"],
        life: (d["Life expectancy at birth, female (years)"]=="..")?undefined:+d["Life expectancy at birth, female (years)"],
        literacy: (d["Literacy rate, adult total (% of people ages 15 and above)"]=="..")?undefined:+d["Literacy rate, adult total (% of people ages 15 and above)"],
        malnutrition: (d["Malnutrition prevalence, weight for age (% of children under 5)"]=="..")?undefined:+d["Literacy rate, adult total (% of people ages 15 and above)"],
        hosBeds: (d["Hospital beds (per 1,000 people)"]=="..")?undefined:+d["Hospital beds (per 1,000 people)"],
        healthExp: (d["Health expenditure, total (% of GDP)"]=="..")?undefined:+d["Health expenditure, total (% of GDP)"]
    };
}

function parseMeta(d){
    var row = {
        country: d["Table Name"],
        incomeGroup: d["Income Group"],
        region: d["Region"],
        code: d["Code"]
    };

    metadataMap.set(d["Table Name"],row);
    return row;
}

function onMouseEnter(d){
    var x = scales.x(d[xQuery]) + margin.l,
        y = height+ margin.b - scales.y(d[yQuery]) + 10;
    var $tooltip = $('.custom-tooltip');

    var w = $tooltip
        .append('<h3>'+d.country+'</h3>')
        .outerWidth();

    $tooltip.css({
        visibility:"visible",
        bottom: y + "px",
        left: x - w/2 + "px"
    });

}
function onMouseLeave(d){
    d3.select('.custom-tooltip')
        .style('visibility','hidden')
        .selectAll('h3')
        .remove();
}

