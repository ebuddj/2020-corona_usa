import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://underscorejs.org/
import _ from 'underscore';

// https://github.com/topojson/topojson
import * as topojson from 'topojson';

// https://www.npmjs.com/package/rc-slider
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';
import './../styles/rc-slider-override.css';

// https://d3js.org/
import * as d3 from 'd3';

let interval, g, path;
// https://observablehq.com/@d3/u-s-map
const projection = d3.geoAlbersUsa().scale(1200).translate([487.5, 325]);

const languages = {
  'en': {
    confirmed:'confirmed',
    deaths:'deaths'
  },
  'sv':{
    confirmed:'bekräftade'
  }
}

const areaInfo = {"Alabama":{"population":4903185,"abbr":"AL","Lat":32.7794,"Long":-86.8287},"Alaska":{"population":731545,"abbr":"AK","Lat":64.0685,"Long":-152.2782},"Arizona":{"population":7278717,"abbr":"AZ","Lat":34.2744,"Long":-111.6602},"Arkansas":{"population":3017825,"abbr":"AR","Lat":34.8938,"Long":-92.4426},"California":{"population":39512223,"abbr":"CA","Lat":37.1841,"Long":-119.4696},"Colorado":{"population":5758736,"abbr":"CO","Lat":38.9972,"Long":-105.5478},"Connecticut":{"population":3565287,"abbr":"CT","Lat":41,"Long":-72.7273},"Delaware":{"population":973764,"abbr":"DE","Lat":39,"Long":-76.2},"District of Columbia":{"population":705749,"abbr":"DC","Lat":38.5,"Long":-77.3},"Florida":{"population":21477737,"abbr":"FL","Lat":28.6305,"Long":-82.4497},"Georgia":{"population":10617423,"abbr":"GA","Lat":32.6415,"Long":-83.4426},"Hawaii":{"population":1415872,"abbr":"HI","Lat":20.2927,"Long":-156.3737},"Idaho":{"population":1787065,"abbr":"ID","Lat":44.3509,"Long":-114.613},"Illinois":{"population":12671821,"abbr":"IL","Lat":40.0417,"Long":-89.1965},"Indiana":{"population":6732219,"abbr":"IN","Lat":39.8942,"Long":-86.2816},"Iowa":{"population":3155070,"abbr":"IA","Lat":42.0751,"Long":-93.496},"Kansas":{"population":2913314,"abbr":"KS","Lat":38.4937,"Long":-98.3804},"Kentucky":{"population":4467673,"abbr":"KY","Lat":37.5347,"Long":-85.3021},"Louisiana":{"population":4648794,"abbr":"LA","Lat":31.0689,"Long":-91.9968},"Maine":{"population":1344212,"abbr":"ME","Lat":45.3695,"Long":-69.2428},"Maryland":{"population":6045680,"abbr":"MD","Lat":38,"Long":-75},"Massachusetts":{"population":6949503,"abbr":"MA","Lat":42.2596,"Long":-71.8083},"Michigan":{"population":9986857,"abbr":"MI","Lat":44.3467,"Long":-85.4102},"Minnesota":{"population":5639632,"abbr":"MN","Lat":46.2807,"Long":-94.3053},"Mississippi":{"population":2976149,"abbr":"MS","Lat":32.7364,"Long":-89.6678},"Missouri":{"population":6137428,"abbr":"MO","Lat":38.3566,"Long":-92.458},"Montana":{"population":1068778,"abbr":"MT","Lat":47.0527,"Long":-109.6333},"Nebraska":{"population":1934408,"abbr":"NE","Lat":41.5378,"Long":-99.7951},"Nevada":{"population":3080156,"abbr":"NV","Lat":39.3289,"Long":-116.6312},"New Hampshire":{"population":1359711,"abbr":"NH","Lat":43.6805,"Long":-71.5811},"New Jersey":{"population":8882190,"abbr":"NJ","Lat":40.1907,"Long":-74.6728},"New Mexico":{"population":2096829,"abbr":"NM","Lat":34.4071,"Long":-106.1126},"New York":{"population":19453561,"abbr":"NY","Lat":42.9538,"Long":-75.5268},"North Carolina":{"population":10488084,"abbr":"NC","Lat":35.5557,"Long":-79.3877},"North Dakota":{"population":762062,"abbr":"ND","Lat":47.4501,"Long":-100.4659},"Ohio":{"population":11689100,"abbr":"OH","Lat":40.2862,"Long":-82.7937},"Oklahoma":{"population":3956971,"abbr":"OK","Lat":35.5889,"Long":-97.4943},"Oregon":{"population":4217737,"abbr":"OR","Lat":43.9336,"Long":-120.5583},"Pennsylvania":{"population":12801989,"abbr":"PA","Lat":40.8781,"Long":-77.7996},"Rhode Island":{"population":1059361,"abbr":"RI","Lat":41,"Long":-70.8},"South Carolina":{"population":5148714,"abbr":"SC","Lat":33.9169,"Long":-80.8964},"South Dakota":{"population":884659,"abbr":"SD","Lat":44.4443,"Long":-100.2263},"Tennessee":{"population":6833174,"abbr":"TN","Lat":35.858,"Long":-86.3505},"Texas":{"population":28995881,"abbr":"TX","Lat":31.4757,"Long":-99.3312},"Utah":{"population":3205958,"abbr":"UT","Lat":39.3055,"Long":-111.6703},"Vermont":{"population":623989,"abbr":"VT","Lat":44.0687,"Long":-72.6658},"Virginia":{"population":8535519,"abbr":"VA","Lat":37.5215,"Long":-78.8537},"Washington":{"population":7614893,"abbr":"WA","Lat":47.3826,"Long":-120.4472},"West Virginia":{"population":1792147,"abbr":"WV","Lat":38.6409,"Long":-80.6227},"Wisconsin":{"population":5822434,"abbr":"WI","Lat":44.6243,"Long":-89.9941},"Wyoming":{"population":578759,"abbr":"WY","Lat":42.9957,"Long":-107.5512}};

function getHashValue(key) {
  let matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

const l = getHashValue('l') ? getHashValue('l') : 'en';
const type = getHashValue('type') ? getHashValue('type') : 'deaths';

const multiplier = (type === 'confirmed') ? 4 : 4; 

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{},
      dates:[],
      total_cases:0,
      total_deaths:0,
      year_month_idx:0
    }
  }
  componentDidMount() {
    // https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv
    d3.json('./data/data.json').then((data) => {
      this.setState((state, props) => ({
        confirmed:data.confirmed,
        deaths:data.deaths,
        dates:_.keys(data[type]['Alabama']).filter((value, index, arr) => {
          return !(value === 'Province_State');
        })
      }), this.drawMap);
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  drawMap() {
    let width = 975;
    let height = 700;
    
    let svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    let tooltip = d3.select('.' + style.map_container)
      .append('div')
      .attr('class', style.hidden + ' ' + style.tooltip);
    d3.json('./data/states-10m.json').then((topology) => {
      g.selectAll('path').data(topojson.feature(topology, topology.objects.states).features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', style.path)
        .attr('fill', (d, i) => {
          return this.getAreaColor(d.properties.name);
        });

      let data = Object.keys(this.state[type]).map(i => this.state[type][i]);

      g.selectAll('circle').data(data)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', 'rgba(255, 82, 51, 0.75)');

      g.selectAll('text').data(data)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[1] + 1;
        })
        .html('')
      let date = this.state.dates[this.state.year_month_idx].split('/');
      this.text = svg.append('text')
        .attr('alignment-baseline', 'top')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '95%')
        // .html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, 0 ' + languages[l][type]);
        .html('' + date[1] + '.' + date[0] + '.' + date[2] + '20');
    });
    setTimeout(() => {
      this.createInterval();
    }, 1000);
  }
  changeAreaAttributes() {
    // Change fill color.
    g.selectAll('path')
      .attr('fill', (d, i) => {
        return this.getAreaColor(d.properties.name);
      });
    g.selectAll('circle')
      .attr('r', (d, i) => {
        this.setState((state, props) => ({
          total_cases:state.total_cases + parseInt(d[this.state.dates[this.state.year_month_idx]] / 14)
        }));
        // Math.log2(Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) + 1) * multiplier;
        return Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / areaInfo[d.Province_State].population * 100000) * 8;
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return (Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / areaInfo[d.Province_State].population * 100000) * 7) + 'px';
      })
      .html((d, i) => {
        if (d[this.state.dates[this.state.year_month_idx]] > 0) {
          return areaInfo[d.Province_State].abbr;
        }
        else {
          return '';
        }
      });
  }
  getAreaColor(area) {
    return '#e5e5e5';
    if (this.state[type][area] !== undefined) {
      if (this.state[type][area][this.state.dates[this.state.year_month_idx]] > 0) {
        return '#808080';
      }
      else {
        return '#e5e5e5';
      }
    }
    else {
    }
  }
  onBeforeSliderChange(value) {
    if (interval) {
      clearInterval(interval)
    }
  }
  onSliderChange(value) {
    this.setState((state, props) => ({
      total_cases:0,
      year_month_idx:value
    }), this.changeAreaAttributes);
  }
  onAfterSliderChange(value) {
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  createInterval() {
    this.changeAreaAttributes();
    interval = setInterval(() => {
      this.setState((state, props) => ({
        total_cases:0,
        year_month_idx:this.state.year_month_idx + 1
      }), this.changeAreaAttributes);
      if (this.state.year_month_idx >= (this.state.dates.length - 1)) {
        clearInterval(interval);
        setTimeout(() => {
          this.setState((state, props) => ({
            total_cases:0,
            year_month_idx:0
          }), this.createInterval);
        }, 2000);
      }
    }, 500);
  }
  render() {
    if (this.text) {
      if (this.state.dates[this.state.year_month_idx]) {
        let datetime = this.state.dates[this.state.year_month_idx].split(' ');
        let date = datetime[0].split('/');
        let time = datetime[1];
        // this.text.html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, ' + this.state.total_cases + ' ' + languages[l][type]);
        this.text.html('' + date[1] + '.' + date[0] + '.20' + date[2]);
      }
    }
    return (
      <div className={style.plus}>
        <div>
          <Slider
            className={style.slider_container}
            dots={false}
            max={this.state.dates.length - 1}
            onAfterChange={this.onAfterSliderChange.bind(this)}
            onBeforeChange={this.onBeforeSliderChange}
            onChange={this.onSliderChange.bind(this)}
            value={this.state.year_month_idx}
          />
          <div className={style.map_container}></div>
        </div>
      </div>
    );
  }
}
export default App;